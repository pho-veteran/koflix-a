import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import prisma from "@/lib/prisma";
import MovieForm from "./components/movie-form";

interface MoviePageProps {
  params: Promise<{
    movieId: string;
  }>;
}

const MoviePage = async ({ params }: MoviePageProps) => {
  const { movieId } = await params;
  
  const isValidObjectId = movieId !== "new" && ObjectId.isValid(movieId);
  
  // Remove episodes from the include clause to make initial load faster
  const movie = isValidObjectId ? await prisma.movie.findUnique({
    where: { id: movieId },
    include: {
      type: true,
      genres: true,
      countries: true,
    }
  }) : null;

  if (movieId !== "new" && !movie) {
    notFound();
  }

  const movieTypes = await prisma.movieType.findMany();
  const genres = await prisma.genre.findMany();
  const countries = await prisma.country.findMany();

  return (
    <div className="container py-6 px-6">
      <MovieForm 
        initialData={movie}
        movieTypes={movieTypes}
        genres={genres}
        countries={countries}
        isNew={!isValidObjectId}
      />
    </div>
  );
};
 
export default MoviePage;