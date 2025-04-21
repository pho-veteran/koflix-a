import { NextResponse } from 'next/server';
import { KKMovieImportPayload, KKApiMovie } from '@/types/kkapi';
import prisma from '@/lib/prisma';

// Helper for batch processing
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

// Helper to update movie and its relations
async function updateMovie(movie: KKApiMovie, dbMovieId: string) {
  // Upsert genres
  const genres = await Promise.all(
    movie.category.map(async (category) =>
      prisma.genre.upsert({
        where: { slug: category.slug },
        update: {},
        create: { name: category.name, slug: category.slug },
      })
    )
  );
  // Upsert countries
  const countries = await Promise.all(
    movie.country.map(async (country) =>
      prisma.country.upsert({
        where: { slug: country.slug },
        update: {},
        create: { name: country.name, slug: country.slug },
      })
    )
  );
  // Upsert movie type
  const type = await prisma.movieType.upsert({
    where: { slug: movie.type },
    update: {},
    create: { name: movie.type, slug: movie.type },
  });
  // Update the movie
  return prisma.movie.update({
    where: { id: dbMovieId },
    data: {
      name: movie.name,
      slug: movie.slug,
      origin_name: movie.origin_name,
      typeId: type.id,
      genreIds: genres.map((g) => g.id),
      countryIds: countries.map((c) => c.id),
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
    },
  });
}

export async function POST(req: Request) {
  try {
    const payload: KKMovieImportPayload = await req.json();
    if (!payload.movies || !Array.isArray(payload.movies)) {
      return NextResponse.json({ error: 'Invalid payload: movies array is required' }, { status: 400 });
    }
    if (!payload.episodes || !Array.isArray(payload.episodes)) {
      return NextResponse.json({ error: 'Invalid payload: episodes array is required' }, { status: 400 });
    }
    if (!payload.episodeServers || !Array.isArray(payload.episodeServers)) {
      return NextResponse.json({ error: 'Invalid payload: episodeServers array is required' }, { status: 400 });
    }
    // Find existing movies by slug
    const slugs = payload.movies.map((m) => m.slug);
    const existingMovies = await prisma.movie.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, slug: true },
    });
    const slugToId = new Map(existingMovies.map((m) => [m.slug, m.id]));
    // Only update movies that exist
    const moviesToUpdate = payload.movies.filter((m) => slugToId.has(m.slug));
    // Batch update movies
    const BATCH_SIZE = 50;
    const updateResults = await processBatch(
      moviesToUpdate,
      BATCH_SIZE,
      async (movie) => updateMovie(movie, slugToId.get(movie.slug)!)
    );
    // Map for movieId lookup
    const movieMappings = new Map<string, string>();
    for (const [movie, result] of updateResults.entries()) {
      if (!(result instanceof Error)) {
        movieMappings.set(movie._id, result.id);
        movieMappings.set(movie.slug, result.id);
      }
    }
    // Filter episodes for updated movies and check which exist
    const episodesToCreate = [];
    for (const ep of payload.episodes) {
      const dbMovieId = movieMappings.get(ep.movieId);
      if (!dbMovieId) continue;
      const exists = await prisma.episode.findFirst({ where: { movieId: dbMovieId, slug: ep.slug } });
      if (!exists) episodesToCreate.push({ ...ep, movieId: dbMovieId });
    }
    // Batch create episodes
    const episodeKeyMap = new Map<string, string>();
    const episodeResults = await processBatch(
      episodesToCreate,
      BATCH_SIZE,
      async (ep) => {
        const created = await prisma.episode.create({ data: { name: ep.name, slug: ep.slug, movieId: ep.movieId } });
        episodeKeyMap.set(`${ep.movieId}:${ep.slug}`, created.id);
        return created;
      }
    );
    // Map existing episodes for episodeServer creation
    for (const [ep, result] of episodeResults.entries()) {
      if (!(result instanceof Error)) {
        episodeKeyMap.set(`${ep.movieId}:${ep.slug}`, result.id);
      }
    }
    // Filter episodeServers for updated movies/episodes and check which exist
    const episodeServersToCreate = [];
    for (const server of payload.episodeServers) {
      const dbMovieId = movieMappings.get(server.movieId);
      if (!dbMovieId) continue;
      const episodeId = episodeKeyMap.get(`${dbMovieId}:${server.slug}`) ||
        (await prisma.episode.findFirst({ where: { movieId: dbMovieId, slug: server.slug }, select: { id: true } }))?.id;
      if (!episodeId) continue;
      const exists = await prisma.episodeServer.findFirst({ where: { episodeId, server_name: server.server_name } });
      if (!exists) episodeServersToCreate.push({ ...server, episodeId });
    }
    // Batch create episodeServers
    const serverResults = await processBatch(
      episodeServersToCreate,
      BATCH_SIZE,
      async (server) => prisma.episodeServer.create({
        data: {
          server_name: server.server_name,
          filename: server.filename,
          link_embed: server.link_embed,
          link_m3u8: server.link_m3u8,
          episodeId: server.episodeId,
        },
      })
    );
    // Collect errors and stats
    const results = {
      movies: { processed: moviesToUpdate.length, succeeded: 0, failed: 0 },
      episodes: { processed: episodesToCreate.length, succeeded: 0, failed: 0 },
      episodeServers: { processed: episodeServersToCreate.length, succeeded: 0, failed: 0 },
    };
    type ErrorItem = { type: string; error: unknown };
    const errors: ErrorItem[] = [];
    for (const [, result] of updateResults.entries()) {
      if (result instanceof Error) { results.movies.failed++; errors.push({ type: 'movie', error: result }); } else { results.movies.succeeded++; }
    }
    for (const [, result] of episodeResults.entries()) {
      if (result instanceof Error) { results.episodes.failed++; errors.push({ type: 'episode', error: result }); } else { results.episodes.succeeded++; }
    }
    for (const [, result] of serverResults.entries()) {
      if (result instanceof Error) { results.episodeServers.failed++; errors.push({ type: 'episodeServer', error: result }); } else { results.episodeServers.succeeded++; }
    }
    return NextResponse.json({ success: true, results, errors: errors.map(e => ({ type: e.type, message: e.error instanceof Error ? e.error.message : String(e.error) })) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
