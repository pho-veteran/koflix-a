import { NextResponse } from 'next/server';
import { KKMovieImportPayload, KKApiMovie } from '@/types/kkapi';
import prisma from '@/lib/prisma';

// Helper function to process movie and its related entities
async function processMovie(movie: KKApiMovie) {
  // First, find or create genre entries
  const genrePromises = movie.category.map(async (category) => {
    return prisma.genre.upsert({
      where: { slug: category.slug },
      update: {}, // No updates if exists
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
      update: {}, // No updates if exists
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
    update: {}, // No updates if exists
    create: {
      name: movie.type,
      slug: movie.type
    }
  });
  
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
      notify: movie.notify,
      showtimes: movie.showtimes,
      view: movie.view
    }
  });
  
  return createdMovie;
}

// POST handler for importing data
export async function POST(req: Request) {
  try {
    // Parse request body
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
    
    // Track the results
    const results = {
      movies: { processed: 0, succeeded: 0, failed: 0 },
      episodes: { processed: 0, succeeded: 0, failed: 0 },
      episodeServers: { processed: 0, succeeded: 0, failed: 0 }
    };
    
    type ImportError = {
      type: 'movie' | 'episode' | 'episodeServer';
      error: Error | unknown;
      item: KKApiMovie | KKMovieImportPayload['episodes'][0] | KKMovieImportPayload['episodeServers'][0];
    };
    
    const errors: ImportError[] = [];
    
    // Step 1: Import movies
    // Map both the API movie _id and slug to our database ID for flexibility
    const movieMappings = new Map<string, string>();
    
    for (const movie of payload.movies) {
      try {
        results.movies.processed++;
        const createdMovie = await processMovie(movie);
        // Store both _id and slug mappings for flexibility
        movieMappings.set(movie._id, createdMovie.id);
        movieMappings.set(movie.slug, createdMovie.id);
        results.movies.succeeded++;
      } catch (error) {
        results.movies.failed++;
        errors.push({ type: 'movie', error, item: movie });
      }
    }
    
    // Step 2: Import episodes
    const episodeKeyMap = new Map<string, string>();
    
    for (const episode of payload.episodes) {
      try {
        results.episodes.processed++;
        // Get the database movie ID
        const dbMovieId = movieMappings.get(episode.movieId);
        if (!dbMovieId) {
          throw new Error(`Movie with ID ${episode.movieId} not found in database`);
        }
        
        const createdEpisode = await prisma.episode.create({
          data: {
            name: episode.name,
            slug: episode.slug,
            movieId: dbMovieId,
          }
        });
        
        // Store composite key for episode servers
        episodeKeyMap.set(`${dbMovieId}:${episode.slug}`, createdEpisode.id);
        results.episodes.succeeded++;
      } catch (error) {
        results.episodes.failed++;
        errors.push({ type: 'episode', error, item: episode });
      }
    }
    
    // Step 3: Import episode servers
    for (const server of payload.episodeServers) {
      try {
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
        
        await prisma.episodeServer.create({
          data: {
            server_name: server.server_name,
            filename: server.filename,
            link_embed: server.link_embed,
            link_m3u8: server.link_m3u8,
            episodeId: episodeId
          }
        });
        
        results.episodeServers.succeeded++;
      } catch (error) {
        results.episodeServers.failed++;
        errors.push({ type: 'episodeServer', error, item: server });
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      errors: errors.length > 0 ? errors.map(e => ({
        type: e.type,
        message: e.error instanceof Error ? e.error.message : String(e.error),
        item: e.item
      })) : []
    });
    
  } catch (error: unknown) {
    console.error('Import error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage
    }, { status: 500 });
  }
}