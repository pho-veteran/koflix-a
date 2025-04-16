import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InteractionType } from "@prisma/client";
import { MovieResult } from "@/types/backendType";

// --- Configuration ---
const TRENDING_WINDOW_DAYS = 7; 
const TRENDING_FINAL_LIMIT = 10;
const TRENDING_CANDIDATE_MULTIPLIER = 3;
const MAX_COUNTRY_REPETITION_IN_GENRE = 3;

async function getGenreTrendingMovies(
    genreId: string,
    limit: number = TRENDING_FINAL_LIMIT
): Promise<{ trending: MovieResult[]; strategy: string }> {
    const trendingSince = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    // 1. Get initial popular candidates within the genre based on recent views
    const trendingInteractions = await prisma.userInteraction.groupBy({
        by: ['movieId'],
        where: {
            interactionType: InteractionType.VIEW,
            timestamp: { gte: trendingSince },
            movie: {
                genreIds: { has: genreId }, // Filter interactions by movies having this genre
            }
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
        // Fallback: Return top overall viewed movies within the genre if no recent interactions
        console.log(`Genre Trending (${genreId}) fallback: No recent interactions, using overall views.`);
        const fallbackMovies = await prisma.movie.findMany({
            where: { genreIds: { has: genreId } }, // Still filter by genre
            orderBy: { view: 'desc' },
            take: limit,
            select: { 
                id: true, 
                name: true, 
                slug: true, 
                poster_url: true, 
                thumb_url: true, 
                year: true,
                genres: { select: { name: true } }
            }
        });
        
        // Map the response to include genres array
        const trending = fallbackMovies.map(m => ({
            ...m,
            genres: m.genres.map(g => g.name), // Convert genre objects to string array
            popularityScore: 0
        }));
        
        return { 
            trending, 
            strategy: 'genre_popularity_fallback_no_interactions' 
        };
    }

    // 2. Fetch details for popular candidates (including countries for diversification)
    const popularMoviesDetails = await prisma.movie.findMany({
        where: { id: { in: popularMovieIds } },
        // Ensure we select countryIds for diversification
        select: { id: true, name: true, slug: true, poster_url: true, thumb_url: true, year: true, countryIds: true, genres: { select: { name: true } } }
    });

    const popularMoviesMap = new Map(popularMoviesDetails.map(m => [m.id, m]));

    // 3. Build final list with country diversification within the genre
    const finalTrendingList: MovieResult[] = [];
    const countryCounts: { [countryId: string]: number } = {};

    for (const movieId of popularMovieIds) {
        if (finalTrendingList.length >= limit) break;

        const movieDetail = popularMoviesMap.get(movieId);
        if (!movieDetail) continue;

        // Check country counts for diversification
        let canAdd = true;
        if (movieDetail.countryIds.length > 0) {
            // Check if adding this movie exceeds the limit for any of its countries
            canAdd = !movieDetail.countryIds.some(cId => (countryCounts[cId] || 0) >= MAX_COUNTRY_REPETITION_IN_GENRE);
        }

        if (canAdd) {
            finalTrendingList.push({
                id: movieDetail.id,
                name: movieDetail.name,
                slug: movieDetail.slug,
                poster_url: movieDetail.poster_url,
                thumb_url: movieDetail.thumb_url,
                year: movieDetail.year,
                genres: movieDetail.genres.map(g => g.name),
                popularityScore: popularityScores[movieId]
            });
            // Increment country counts for the added movie
            movieDetail.countryIds.forEach(cId => {
                countryCounts[cId] = (countryCounts[cId] || 0) + 1;
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
                 year: movieDetail.year, genres: movieDetail.genres.map(g => g.name),
                 popularityScore: popularityScores[movieId]
             });
             addedCount++;
        }
    }

    return { trending: finalTrendingList, strategy: 'genre_popularity_with_diversity' };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // Expect genreId or genreSlug
        const { genreId, genreSlug }: { genreId?: string; genreSlug?: string } = body;
        let resolvedGenreId: string | undefined = genreId;

        if (!resolvedGenreId && !genreSlug) {
            return NextResponse.json({ error: "genreId or genreSlug is required" }, { status: 400 });
        }

        // If slug is provided, find the ID
        if (!resolvedGenreId && genreSlug) {
            const genre = await prisma.genre.findUnique({
                where: { slug: genreSlug },
                select: { id: true }
            });
            if (!genre) {
                return NextResponse.json({ error: `Genre with slug '${genreSlug}' not found` }, { status: 404 });
            }
            resolvedGenreId = genre.id;
        }

         if (!resolvedGenreId) {
             return NextResponse.json({ error: "Could not resolve genre ID" }, { status: 400 });
        }

        const { trending, strategy } = await getGenreTrendingMovies(resolvedGenreId);
        return NextResponse.json({ data: trending, strategy: strategy });

    } catch (error: unknown) {
        if (error instanceof SyntaxError && error.message.includes("JSON")) {
             return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }
        console.error("Genre Trending Recommendations API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch genre trending recommendations", details: errorMessage },
            { status: 500 }
        );
    }
}