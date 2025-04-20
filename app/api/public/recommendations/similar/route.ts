import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MovieFrontEndResult } from "@/types/backendType";

async function getRelatedMovies(movieId: string, limit: number = 10): Promise<{ related: MovieFrontEndResult[]; strategy: string }> {
    const targetMovie = await prisma.movie.findUnique({
        where: { id: movieId },
        select: {
            id: true,
            genreIds: true,
            countryIds: true,
        }
    });

    if (!targetMovie) {
        return { related: [], strategy: 'not_found' };
    }

    // --- Strategy: Feature Matching (Genres/Countries) ---
    // Find movies that share at least one genre OR one country
    // Order by a popularity metric (e.g., rating, view count)
    // We calculate a simple score based on shared features.

    const relatedByFeatures = await prisma.movie.findMany({
        where: {
            AND: [
                { id: { not: movieId } }, // Exclude the target movie itself
                {
                    OR: [
                        { genreIds: { hasSome: targetMovie.genreIds } },
                        { countryIds: { hasSome: targetMovie.countryIds } },
                    ]
                }
            ]
        },
        // Fetch more than limit initially to allow for scoring/sorting
        take: limit * 3, // Fetch more candidates to score
        orderBy: [
            { rating: 'desc' }, // Prioritize higher rated
            { view: 'desc' }    // Then by views
        ],
        select: {
            id: true, name: true, slug: true, poster_url: true, thumb_url: true, year: true,
            genreIds: true, // Select features needed for scoring
            countryIds: true
        }
    });

    // Calculate a simple match score
    const scoredMovies = relatedByFeatures.map(movie => {
        let score = 0;
        const sharedGenres = movie.genreIds.filter(id => targetMovie.genreIds.includes(id)).length;
        const sharedCountries = movie.countryIds.filter(id => targetMovie.countryIds.includes(id)).length;

        // Simple scoring: more shared features = higher score
        score += sharedGenres * 2; // Weight genres more?
        score += sharedCountries * 1;

        return {
            id: movie.id,
            name: movie.name,
            slug: movie.slug,
            poster_url: movie.poster_url,
            thumb_url: movie.thumb_url,
            year: movie.year,
            score: score // Assign calculated score
        };
    }).sort((a, b) => b.score - a.score); // Sort primarily by our match score

    const finalRelated = scoredMovies.slice(0, limit);

    return {
        related: finalRelated,
        strategy: finalRelated.length > 0 ? 'feature_matching' : 'none'
    };
}


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { movieId }: { movieId?: string } = body;

        if (!movieId || typeof movieId !== 'string') {
            return NextResponse.json({ error: "movieId (string) is required" }, { status: 400 });
        }

        const { related, strategy } = await getRelatedMovies(movieId);
        return NextResponse.json({ data: related, strategy: strategy });

    } catch (error: unknown) {
        if (error instanceof SyntaxError && error.message.includes("JSON")) {
             return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }
        console.error("Related Recommendations API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: "Failed to fetch related recommendations", details: errorMessage }, { status: 500 });
    }
}