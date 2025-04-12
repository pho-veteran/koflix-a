import { KKApiMovie, KKApiEpisode, KKMovieImportPayload } from "./kkapi";

interface EpisodeMapping {
  movieSlug: string;
  episodes: KKApiEpisode[];
}

export function formatImportMoviesArray(
  movies: KKApiMovie[], 
  episodesMappings: EpisodeMapping[] = []
): KKMovieImportPayload {
  const result: KKMovieImportPayload = {
    movies: movies,
    episodes: [],
    episodeServers: []
  };

  // Process episodes if provided
  episodesMappings.forEach(mapping => {
    const movie = movies.find(m => m.slug === mapping.movieSlug);
    if (!movie) return;

    mapping.episodes.forEach(serverGroup => {
      // Create episode entry (one per episode name)
      const episodeNames = new Set(serverGroup.server_data.map(ep => ep.name));
      
      episodeNames.forEach(episodeName => {
        const episodeServers = serverGroup.server_data.filter(ep => ep.name === episodeName);
        if (!episodeServers.length) return;
        
        // Get the slug from the first server entry
        const episodeSlug = episodeServers[0].slug;
        
        // Add episode to result
        result.episodes.push({
          name: episodeName,
          slug: episodeSlug,
          movieId: movie._id
        });
        
        // Add episode servers
        episodeServers.forEach(server => {
          result.episodeServers.push({
            server_name: serverGroup.server_name,
            filename: server.filename,
            link_embed: server.link_embed,
            link_m3u8: server.link_m3u8,
            movieId: movie._id,
            slug: episodeSlug
          });
        });
      });
    });
  });

  return result;
}