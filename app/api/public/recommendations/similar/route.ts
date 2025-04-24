import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MovieFrontEndResult } from "@/types/backendType";
import { performVectorSearch } from "@/lib/atlas-search";

async function getRelatedMovies(movieId: string, limit: number = 10): Promise<{ related: MovieFrontEndResult[]; strategy: string }> {
    const targetMovie = await prisma.movie.findUnique({
        where: { id: movieId },
        select: {
            id: true,
            contentEmbedding: true,
            genreIds: true,
            countryIds: true,
        }
    });

    if (!targetMovie) {
        return { related: [], strategy: 'not_found' };
    }

    if (!targetMovie.contentEmbedding || targetMovie.contentEmbedding.length === 0) {
        console.log(`Movie ${movieId} has no embedding, falling back to feature matching.`);
        return getRelatedMoviesByFeatures(movieId, targetMovie.genreIds, targetMovie.countryIds, limit);
    }

    try {
        const numCandidates = limit * 10;

        const vectorSearchResults = await performVectorSearch({
            collection: "Movie",
            index: "content-vector-index",
            path: "contentEmbedding",
            queryVector: targetMovie.contentEmbedding,
            numCandidates: numCandidates,
            limit: limit,
            filter: { "_id": { "$ne": { "$oid": movieId } } },
        });

        if (vectorSearchResults.length > 0) {
            // MovieFrontEndResult structure
            const relatedMovies: MovieFrontEndResult[] = vectorSearchResults.map(movie => ({
                id: movie.id,
                name: movie.name,
                slug: movie.slug,
                poster_url: movie.poster_url,
                thumb_url: movie.thumb_url,
                year: movie.year,
                score: movie.score 
            }));

            return {
                related: relatedMovies,
                strategy: 'vector_search'
            };
        }

        // Fallback if vector search returns no results
        console.log("Vector search returned no results, falling back to feature matching.");
        return getRelatedMoviesByFeatures(movieId, targetMovie.genreIds, targetMovie.countryIds, limit);

    } catch (error) {
        console.error("Vector search failed, falling back to feature matching:", error);
        return getRelatedMoviesByFeatures(movieId, targetMovie.genreIds, targetMovie.countryIds, limit);
    }
}

// Original feature matching strategy as fallback
async function getRelatedMoviesByFeatures(
    movieId: string,
    genreIds: string[],
    countryIds: string[],
    limit: number
): Promise<{ related: MovieFrontEndResult[]; strategy: string }> {
    const relatedByFeatures = await prisma.movie.findMany({
        where: {
            AND: [
                { id: { not: movieId } },
                {
                    OR: [
                        { genreIds: { hasSome: genreIds } },
                        { countryIds: { hasSome: countryIds } },
                    ]
                }
            ]
        },
        take: limit * 3, // Fetch more for scoring and slicing
        orderBy: [
            // Consider relevance-based ordering if possible, or keep existing
            { rating: 'desc' },
            { view: 'desc' }
        ],
        select: {
            id: true, name: true, slug: true, poster_url: true, thumb_url: true, year: true,
            genreIds: true, countryIds: true 
        }
    });

    // Calculate a simple match score based on shared genres/countries
    const scoredMovies = relatedByFeatures.map(movie => {
        let score = 0;
        const sharedGenres = movie.genreIds.filter(id => genreIds.includes(id)).length;
        const sharedCountries = movie.countryIds.filter(id => countryIds.includes(id)).length;

        // Simple scoring logic (adjust weights as needed)
        score += sharedGenres * 2; // Weight genres higher
        score += sharedCountries * 1;

        return {
            id: movie.id,
            name: movie.name,
            slug: movie.slug,
            poster_url: movie.poster_url,
            thumb_url: movie.thumb_url,
            year: movie.year,
            score: score // Use the calculated feature match score
        };
    }).sort((a, b) => b.score - a.score); // Sort by the calculated score

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

        // Add limit parameter if you want to control it from the request
        const limit = 10;
        const { related, strategy } = await getRelatedMovies(movieId, limit);

        console.log(`Recommendations for ${movieId}: Found ${related.length}, Strategy: ${strategy}`);
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