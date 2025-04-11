import prisma from "@/lib/prisma";
import { format } from "date-fns";

import { MovieTypeClient } from "./components/client";

const MovieTypesPage = async () => {
    const movieTypes = await prisma.movieType.findMany({
        include: {
            movies: true
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const formattedMovieTypes = movieTypes.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        movieCount: item.movies.length,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <MovieTypeClient data={formattedMovieTypes} />
            </div>
        </div>
    );
};

export default MovieTypesPage;