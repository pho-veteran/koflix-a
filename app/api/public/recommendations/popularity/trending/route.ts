import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InteractionType } from "@prisma/client";
import { MovieFrontEndResult } from "@/types/backendType";

// --- Configuration ---
const TRENDING_WINDOW_DAYS = 3;
const TRENDING_FINAL_LIMIT = 10;
const TRENDING_CANDIDATE_MULTIPLIER = 2;
const MAX_GENRE_REPETITION = 3;

async function getTrendingMovies(limit: number = TRENDING_FINAL_LIMIT): Promise<{ trending: MovieFrontEndResult[]; strategy: string }> {
    const trendingSince = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    // 1. Get initial popular candidates based on recent views
    const trendingInteractions = await prisma.userInteraction.groupBy({
        by: ['movieId'],
        where: {
            interactionType: InteractionType.VIEW,
            timestamp: { gte: trendingSince },
        },
        _count: { movieId: true },
        orderBy: { _count: { movieId: 'desc' } },
        take: limit * TRENDING_CANDIDATE_MULTIPLIER,
    });

    const popularMovieIds = trendingInteractions.map(item => item.movieId);
    const popularityScores: { [key: string]: number } = trendingInteractions.reduce((acc, item) => {
        acc[item.movieId] = item._count.movieId;
        return acc;
    }, {} as { [key: string]: number });

    if (popularMovieIds.length === 0) {
        // Fallback: Return top overall viewed movies
        console.log("Trending fallback: No recent view interactions found, using overall views.");
        const fallbackMovies = await prisma.movie.findMany({
            orderBy: { view: 'desc' },
            take: limit,
            select: {
                id: true, name: true, slug: true, poster_url: true, thumb_url: true, year: true,
                genres: { select: { name: true } } // Select genre names in fallback
            }
        });
        // Map fallback movies to include genre names array
        const trending = fallbackMovies.map(m => ({
            ...m,
            genres: m.genres.map(g => g.name), // Map genre objects to names
            popularityScore: 0
        }));
        return { trending, strategy: 'popularity_fallback_no_interactions' };
    }

    // 2. Fetch details for popular candidates (including genre slugs for diversification and names for output)
    const popularMoviesDetails = await prisma.movie.findMany({
        where: { id: { in: popularMovieIds } },
        select: {
            id: true, name: true, slug: true, poster_url: true, thumb_url: true, year: true,
            genres: { select: { slug: true, name: true } } // Select both slug and name
        }
    });

    const popularMoviesMap = new Map(popularMoviesDetails.map(m => [m.id, m]));

    // 3. Build final list with simple genre diversification (using slugs internally)
    const finalTrendingList: MovieFrontEndResult[] = [];
    const genreCounts: { [genreSlug: string]: number } = {}; // Use slug as key for diversification

    for (const movieId of popularMovieIds) {
        if (finalTrendingList.length >= limit) break;

        const movieDetail = popularMoviesMap.get(movieId);
        if (!movieDetail) continue;

        const movieGenreSlugs = movieDetail.genres.map(g => g.slug); // Get slugs for diversification checks
        const movieGenreNames = movieDetail.genres.map(g => g.name); // Get names for output

        // Check genre counts using slugs
        let canAdd = true;
        if (movieGenreSlugs.length > 0) {
            canAdd = !movieGenreSlugs.some(slug => (genreCounts[slug] || 0) >= MAX_GENRE_REPETITION);
        }

        if (canAdd) {
            finalTrendingList.push({
                id: movieDetail.id,
                name: movieDetail.name,
                slug: movieDetail.slug,
                poster_url: movieDetail.poster_url,
                thumb_url: movieDetail.thumb_url,
                year: movieDetail.year,
                genres: movieGenreNames, // Add genre names to the result
                popularityScore: popularityScores[movieId]
            });
            // Increment genre counts using slugs
            movieGenreSlugs.forEach(slug => {
                genreCounts[slug] = (genreCounts[slug] || 0) + 1;
            });
        }
    }

     // 4. Fill remaining if needed (less strict)
    if (finalTrendingList.length < limit) {
        const needed = limit - finalTrendingList.length;
        const existingIds = finalTrendingList.map(m => m.id);
        let addedCount = 0;
        for (const movieId of popularMovieIds) {
             if (addedCount >= needed) break;
             if (existingIds.includes(movieId)) continue;
             const movieDetail = popularMoviesMap.get(movieId);
             if (!movieDetail) continue;
             finalTrendingList.push({
                 id: movieDetail.id, name: movieDetail.name, slug: movieDetail.slug,
                 poster_url: movieDetail.poster_url, thumb_url: movieDetail.thumb_url,
                 year: movieDetail.year,
                 genres: movieDetail.genres.map(g => g.name), // Add genre names here too
                 popularityScore: popularityScores[movieId]
             });
             addedCount++;
        }
    }

    return { trending: finalTrendingList, strategy: 'popularity_diversified_genre' };
}

export async function GET() {
    try {
        const { trending, strategy } = await getTrendingMovies();
        return NextResponse.json({ data: trending, strategy: strategy });

    } catch (error: unknown) {
        console.error("Trending Recommendations API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json( { error: "Failed to fetch trending recommendations", details: errorMessage }, { status: 500 });
    }
}