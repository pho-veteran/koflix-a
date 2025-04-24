import { NextResponse } from 'next/server';
import { KKMovieImportPayload, KKApiMovie } from '@/types/kkapi';
import prisma from '@/lib/prisma';
import { generateEmbedding } from '@/lib/openai';

type KKApiEpisodeItem = {
  name: string;
  slug: string;
  movieId: string;
};

type KKApiEpisodeServerItem = {
  server_name: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
  movieId: string;
  slug: string;
};

type ImportItem = KKApiMovie | KKApiEpisodeItem | KKApiEpisodeServerItem;

// Helper function for batch processing with controlled concurrency
async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processItem: (item: T) => Promise<R>
): Promise<Map<T, R | Error>> {
  const results = new Map<T, R | Error>();
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map(async (item) => {
      try {
        const result = await processItem(item);
        results.set(item, result);
        return { item, result, success: true };
      } catch (error) {
        results.set(item, error instanceof Error ? error : new Error(String(error)));
        return { item, error, success: false };
      }
    });
    
    await Promise.all(batchPromises);
  }
  
  return results;
}

async function processMovie(movie: KKApiMovie) {
  // Find or create genre entries
  const genrePromises = movie.category.map(async (category) => {
    return prisma.genre.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        name: category.name,
        slug: category.slug
      }
    });
  });
  const genres = await Promise.all(genrePromises);
  
  // Find or create country entries
  const countryPromises = movie.country.map(async (country) => {
    return prisma.country.upsert({
      where: { slug: country.slug },
      update: {},
      create: {
        name: country.name,
        slug: country.slug
      }
    });
  });
  const countries = await Promise.all(countryPromises);
  
  // Find or create movie type
  const type = await prisma.movieType.upsert({
    where: { slug: movie.type },
    update: {},
    create: {
      name: movie.type,
      slug: movie.type
    }
  });
  
  // Generate embedding for movie content
  let contentEmbedding: number[] = [];
  if (movie.content && movie.content.trim() !== '') {
    try {
      contentEmbedding = await generateEmbedding(movie.content);
      console.log(`Generated embedding for movie: ${movie.name} (${contentEmbedding.length} dimensions)`);
    } catch (error) {
      console.error(`Failed to generate embedding for movie: ${movie.name}`, error);
      // Continue with import even if embedding generation fails
    }
  }
  
  // Create the movie
  const createdMovie = await prisma.movie.create({
    data: {
      name: movie.name,
      slug: movie.slug,
      origin_name: movie.origin_name,
      typeId: type.id,
      genreIds: genres.map(g => g.id),
      countryIds: countries.map(c => c.id),
      year: movie.year,
      time: movie.time,
      poster_url: movie.poster_url,
      thumb_url: movie.thumb_url,
      trailer_url: movie.trailer_url,
      quality: movie.quality,
      lang: movie.lang,
      sub_docquyen: movie.sub_docquyen,
      episode_current: movie.episode_current,
      episode_total: movie.episode_total,
      status: movie.status,
      is_copyright: movie.is_copyright,
      chieurap: movie.chieurap,
      tmdb_id: movie.tmdb?.id,
      tmdb_type: movie.tmdb?.type,
      tmdb_season: movie.tmdb?.season,
      vote_average: movie.tmdb?.vote_average,
      vote_count: movie.tmdb?.vote_count,
      imdb_id: movie.imdb?.id,
      actor: movie.actor || [],
      director: movie.director || [],
      content: movie.content,
      contentEmbedding: contentEmbedding,
      notify: movie.notify,
      showtimes: movie.showtimes,
    }
  });
  
  return createdMovie;
}

// POST handler for importing data
export async function POST(req: Request) {
  try {
    const payload: KKMovieImportPayload = await req.json();
    
    // Validate payload structure
    if (!payload.movies || !Array.isArray(payload.movies)) {
      return NextResponse.json({ error: 'Invalid payload: movies array is required' }, { status: 400 });
    }
    if (!payload.episodes || !Array.isArray(payload.episodes)) {
      return NextResponse.json({ error: 'Invalid payload: episodes array is required' }, { status: 400 });
    }
    if (!payload.episodeServers || !Array.isArray(payload.episodeServers)) {
      return NextResponse.json({ error: 'Invalid payload: episodeServers array is required' }, { status: 400 });
    }
    
    // Results tracking
    const results = {
      movies: { processed: 0, succeeded: 0, failed: 0 },
      episodes: { processed: 0, succeeded: 0, failed: 0 },
      episodeServers: { processed: 0, succeeded: 0, failed: 0 }
    };
    
    const errors: Array<{
      type: 'movie' | 'episode' | 'episodeServer';
      error: Error | unknown;
      item: ImportItem; 
    }> = [];
    
    // Set batch size
    const BATCH_SIZE = 50;
    
    // Step 1: Process movies in parallel batches
    console.log(`Processing ${payload.movies.length} movies in parallel batches of ${BATCH_SIZE}...`);
    const movieMappings = new Map<string, string>();
    
    const movieResults = await processBatch(
      payload.movies,
      BATCH_SIZE,
      async (movie) => {
        results.movies.processed++;
        return await processMovie(movie);
      }
    );
    
    // Process movie results and build mappings
    for (const [movie, result] of movieResults.entries()) {
      if (result instanceof Error) {
        results.movies.failed++;
        errors.push({ type: 'movie', error: result, item: movie });
      } else {
        // Store both _id and slug mappings
        movieMappings.set(movie._id, result.id);
        movieMappings.set(movie.slug, result.id);
        results.movies.succeeded++;
      }
    }
    
    // Step 2: Process episodes in parallel batches
    console.log(`Processing ${payload.episodes.length} episodes in parallel batches of ${BATCH_SIZE}...`);
    const episodeKeyMap = new Map<string, string>();
    
    const episodeResults = await processBatch(
      payload.episodes,
      BATCH_SIZE,
      async (episode) => {
        results.episodes.processed++;
        
        // Get database movie ID
        const dbMovieId = movieMappings.get(episode.movieId);
        if (!dbMovieId) {
          throw new Error(`Movie with ID ${episode.movieId} not found in database`);
        }
        
        return await prisma.episode.create({
          data: {
            name: episode.name,
            slug: episode.slug,
            movieId: dbMovieId,
          }
        });
      }
    );
    
    // Process episode results and build mappings
    for (const [episode, result] of episodeResults.entries()) {
      if (result instanceof Error) {
        results.episodes.failed++;
        errors.push({ type: 'episode', error: result, item: episode });
      } else {
        const dbMovieId = movieMappings.get(episode.movieId);
        if (dbMovieId) {
          // Store composite key for episode servers
          episodeKeyMap.set(`${dbMovieId}:${episode.slug}`, result.id);
          results.episodes.succeeded++;
        }
      }
    }
    
    // Step 3: Process episode servers in parallel batches
    console.log(`Processing ${payload.episodeServers.length} episode servers in parallel batches of ${BATCH_SIZE}...`);
    
    const serverResults = await processBatch(
      payload.episodeServers,
      BATCH_SIZE,
      async (server) => {
        results.episodeServers.processed++;
        
        // Get movie database ID
        const dbMovieId = movieMappings.get(server.movieId);
        if (!dbMovieId) {
          throw new Error(`Movie with ID ${server.movieId} not found in database`);
        }
        
        // Get episode ID using the composite key
        const episodeId = episodeKeyMap.get(`${dbMovieId}:${server.slug}`);
        if (!episodeId) {
          throw new Error(`Episode with movieId ${server.movieId} and slug ${server.slug} not found`);
        }
        
        return await prisma.episodeServer.create({
          data: {
            server_name: server.server_name,
            filename: server.filename,
            link_embed: server.link_embed,
            link_m3u8: server.link_m3u8,
            episodeId: episodeId
          }
        });
      }
    );
    
    // Process server results
    for (const [server, result] of serverResults.entries()) {
      if (result instanceof Error) {
        results.episodeServers.failed++;
        errors.push({ type: 'episodeServer', error: result, item: server });
      } else {
        results.episodeServers.succeeded++;
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      errors: errors.map(e => ({
        type: e.type,
        message: e.error instanceof Error ? e.error.message : String(e.error),
        item: e.item
      }))
    });
    
  } catch (error: unknown) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}