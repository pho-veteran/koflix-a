import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import prisma from "@/lib/prisma";
import EpisodeClient from "./components/client";
import { Movie } from "@prisma/client";

interface EpisodePageProps {
  params: Promise<{
    movieId: string;
    episodeId: string;
  }>;
}

const EpisodePage = async ({ params }: EpisodePageProps) => {
  const { movieId, episodeId } = await params;
  
  const isValidObjectId = episodeId !== "new" && ObjectId.isValid(episodeId);
  
  // Fetch episode data if it exists
  const episode = isValidObjectId ? await prisma.episode.findUnique({
    where: { id: episodeId },
    include: {
      movie: {
        select: {
          name: true,
          slug: true
        }
      },
      servers: true,
    }
  }) : null;

  // Fetch movie data (needed for both new and existing episodes)
  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    select: {
      id: true,
      name: true,
      slug: true,
    }
  });

  if (!movie) {
    notFound();
  }

  if (episodeId !== "new" && !episode) {
    notFound();
  }

  return (
    <div className="container py-6 px-6">
      <EpisodeClient 
        initialData={episode}
        movie={movie as Movie} // Add type assertion
        isNew={!isValidObjectId}
      />
    </div>
  );
};
 
export default EpisodePage;