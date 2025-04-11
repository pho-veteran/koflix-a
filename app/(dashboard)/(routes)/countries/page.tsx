import prisma from "@/lib/prisma";
import { format } from "date-fns";

import { CountryClient } from "./components/client";

const CountriesPage = async () => {
    const countries = await prisma.country.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });

    const formattedCountries = countries.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        movieCount: item.movieIds.length,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CountryClient data={formattedCountries} />
            </div>
        </div>
    );
};

export default CountriesPage;