import { KKApiMovie, KKApiEpisode, KKApiServerEpisode, KKMovieImportPayload } from "./kkapi";

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

  const addedEpisodes = new Set<string>();

  episodesMappings.forEach(mapping => {
    const movie = movies.find(m => m.slug === mapping.movieSlug);
    if (!movie) return;

    const episodesGroupedBySlug = new Map<string, { name: string; servers: { server_name: string; data: KKApiServerEpisode }[] }>();

    // First pass: Collect and group all server data by episode slug
    mapping.episodes.forEach(serverGroup => {
      serverGroup.server_data.forEach(serverData => {
        const episodeSlug = serverData.slug;
        const episodeName = serverData.name;

        if (!episodesGroupedBySlug.has(episodeSlug)) {
          episodesGroupedBySlug.set(episodeSlug, { name: episodeName, servers: [] });
        }

        // Add the server details under the correct episode slug
        episodesGroupedBySlug.get(episodeSlug)!.servers.push({
          server_name: serverGroup.server_name,
          data: serverData
        });
      });
    });

    // Second pass: Populate the result arrays based on the grouped data
    episodesGroupedBySlug.forEach((episodeData, episodeSlug) => {
      const uniqueEpisodeKey = `${movie._id}:${episodeSlug}`;

      // Add the unique episode entry if it hasn't been added yet
      if (!addedEpisodes.has(uniqueEpisodeKey)) {
        result.episodes.push({
          name: episodeData.name,
          slug: episodeSlug,
          movieId: movie._id
        });
        addedEpisodes.add(uniqueEpisodeKey);
      }

      episodeData.servers.forEach(serverInfo => {
        result.episodeServers.push({
          server_name: serverInfo.server_name,
          filename: serverInfo.data.filename,
          link_embed: serverInfo.data.link_embed,
          link_m3u8: serverInfo.data.link_m3u8,
          movieId: movie._id,
          slug: episodeSlug
        });
      });
    });
  });

  return result;
}