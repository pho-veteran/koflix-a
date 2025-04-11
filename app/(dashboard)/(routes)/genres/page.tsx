import prisma from "@/lib/prisma";
import { format } from "date-fns";

import { GenreClient } from "./components/client";

const GenresPage = async () => {
    const genres = await prisma.genre.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });

    const formattedGenres = genres.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        movieCount: item.movieIds.length,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <GenreClient data={formattedGenres} />
            </div>
        </div>
    );
};

export default GenresPage;