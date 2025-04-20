import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InteractionType } from "@prisma/client";
import { MovieFrontEndResult } from "@/types/backendType";

// --- Configuration ---
const TRENDING_WINDOW_DAYS = 7;
const TRENDING_FINAL_LIMIT = 10;
const TRENDING_CANDIDATE_MULTIPLIER = 3;
const MAX_GENRE_REPETITION_IN_TYPE = 2; 

async function getTypeTrendingMovies(
    typeId: string, // Renamed parameter
    limit: number = TRENDING_FINAL_LIMIT
): Promise<{ trending: MovieFrontEndResult[]; strategy: string }> {
    const trendingSince = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    // 1. Get initial popular candidates
    const trendingInteractions = await prisma.userInteraction.groupBy({
        by: ['movieId'],
        where: {
            interactionType: InteractionType.VIEW,
            timestamp: { gte: trendingSince },
            movie: { typeId: typeId }
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
        console.log(`Type Trending (${typeId}) fallback: No recent interactions, using overall views.`);
        const fallbackMovies = await prisma.movie.findMany({
            where: { typeId: typeId },
            orderBy: { view: 'desc' },
            take: limit,
            select: {
                id: true, name: true, slug: true, poster_url: true, thumb_url: true, year: true,
                genres: { select: { name: true } }
            }
        });
        const trending = fallbackMovies.map(m => ({
            ...m,
            genres: m.genres.map(g => g.name),
            popularityScore: 0
        }));
        // Updated strategy string
        return { trending, strategy: 'type_popularity_fallback_no_interactions' };
    }

    // 2. Fetch details for popular candidates
    const popularMoviesDetails = await prisma.movie.findMany({
        where: { id: { in: popularMovieIds } },
        select: {
            id: true, name: true, slug: true, poster_url: true, thumb_url: true, year: true,
            genres: { select: { slug: true, name: true } }
        }
    });

    const popularMoviesMap = new Map(popularMoviesDetails.map(m => [m.id, m]));

    // 3. Build final list with genre diversification
    const finalTrendingList: MovieFrontEndResult[] = [];
    const genreCounts: { [genreSlug: string]: number } = {};

    for (const movieId of popularMovieIds) {
        if (finalTrendingList.length >= limit) break;

        const movieDetail = popularMoviesMap.get(movieId);
        if (!movieDetail) continue;

        const movieGenreSlugs = movieDetail.genres.map(g => g.slug);
        const movieGenreNames = movieDetail.genres.map(g => g.name);

        let canAdd = true;
        if (movieGenreSlugs.length > 0) {
            canAdd = !movieGenreSlugs.some(slug => (genreCounts[slug] || 0) >= MAX_GENRE_REPETITION_IN_TYPE);
        }

        if (canAdd) {
            finalTrendingList.push({
                id: movieDetail.id,
                name: movieDetail.name,
                slug: movieDetail.slug,
                poster_url: movieDetail.poster_url,
                thumb_url: movieDetail.thumb_url,
                year: movieDetail.year,
                genres: movieGenreNames,
                popularityScore: popularityScores[movieId]
            });
            movieGenreSlugs.forEach(slug => {
                genreCounts[slug] = (genreCounts[slug] || 0) + 1;
            });
        }
    }

     // 4. Fill remaining if needed
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
                 genres: movieDetail.genres.map(g => g.name),
                 popularityScore: popularityScores[movieId]
             });
             addedCount++;
        }
    }
    return { trending: finalTrendingList, strategy: 'type_popularity_diversified_genre' };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { typeId, typeSlug }: { typeId?: string; typeSlug?: string } = body;
        let resolvedTypeId: string | undefined = typeId;

        if (!resolvedTypeId && !typeSlug) {
            return NextResponse.json({ error: "typeId or typeSlug is required" }, { status: 400 });
        }
        if (!resolvedTypeId && typeSlug) {
            const movieType = await prisma.movieType.findUnique({ where: { slug: typeSlug }, select: { id: true } });
            if (!movieType) {
                return NextResponse.json({ error: `Type with slug '${typeSlug}' not found` }, { status: 404 });
            }
            resolvedTypeId = movieType.id;
        }
        if (!resolvedTypeId) {
            return NextResponse.json({ error: "Could not resolve type ID" }, { status: 400 });
        }

        const { trending, strategy } = await getTypeTrendingMovies(resolvedTypeId);
        return NextResponse.json({ data: trending, strategy: strategy });

    } catch (error: unknown) {
        if (error instanceof SyntaxError && error.message.includes("JSON")) {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }
        console.error("Type Trending Recommendations API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json( { error: "Failed to fetch type trending recommendations", details: errorMessage }, { status: 500 });
    }
}