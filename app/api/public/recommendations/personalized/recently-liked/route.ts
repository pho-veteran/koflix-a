import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InteractionType } from "@prisma/client";
import { MovieResult } from "@/types/backendType";

// --- Configuration ---
const RECENT_LIKES_LIMIT = 15;
const RECOMMENDATION_LIMIT = 10;

async function getRecommendationsBasedOnRecentLikes(userId: string, limit: number = RECOMMENDATION_LIMIT): Promise<{ recommendations: MovieResult[]; strategy: string }> {
    let recommendations: MovieResult[] = [];
    let strategy = 'popularity_fallback';

    // 1. Get user's recent LIKE interactions
    const recentLikes = await prisma.userInteraction.findMany({
        where: {
            userId,
            interactionType: InteractionType.LIKE,
        },
        select: { movieId: true, timestamp: true },
        orderBy: { timestamp: 'desc' },
        take: RECENT_LIKES_LIMIT,
    });

    const likedMovieIds = [...new Set(recentLikes.map(i => i.movieId))];

    if (likedMovieIds.length === 0) {
        strategy = 'no_recent_likes';
        // Optional: Fallback to popular movies if no recent likes
        // const popularMovies = await prisma.movie.findMany({ ... });
        // recommendations = popularMovies.map(m => ({ ...m, score: 0 }));
        // strategy = 'no_recent_likes_popular_fallback';
        return { recommendations, strategy };
    }

    // 2. Get features (genres, countries) of liked movies
    const likedMoviesFeatures = await prisma.movie.findMany({
        where: { id: { in: likedMovieIds } },
        select: { genreIds: true, countryIds: true }
    });
    const preferredGenreIds = [...new Set(likedMoviesFeatures.flatMap(m => m.genreIds))];
    const preferredCountryIds = [...new Set(likedMoviesFeatures.flatMap(m => m.countryIds))];

    // 3. Get all movies user has interacted with (for exclusion)
    const allInteractedMovieIds = [...new Set((await prisma.userInteraction.findMany({
        where: { userId }, select: { movieId: true }, take: 500 // Broader history for exclusion
    })).map(i => i.movieId))];

    // 4. Find candidate movies based on shared features
    const candidates = await prisma.movie.findMany({
        where: {
            id: { notIn: allInteractedMovieIds }, // Exclude already interacted movies
            OR: [
                { genreIds: { hasSome: preferredGenreIds } },
                { countryIds: { hasSome: preferredCountryIds } },
            ]
        },
        take: limit * 5, // Fetch more candidates for scoring
        orderBy: [
            { rating: 'desc' },
            { view: 'desc' }
        ],
        select: {
            id: true, name: true, slug: true, poster_url: true, thumb_url: true, year: true,
            genreIds: true, countryIds: true
        }
    });

    // 5. Score candidates based on feature overlap
    const scoredCandidates = candidates.map(movie => {
        let score = 0;
        const sharedGenres = movie.genreIds.filter(id => preferredGenreIds.includes(id)).length;
        const sharedCountries = movie.countryIds.filter(id => preferredCountryIds.includes(id)).length;
        score += sharedGenres * 2;
        score += sharedCountries * 1;
        return { ...movie, score };
    }).sort((a, b) => b.score - a.score);

    recommendations = scoredCandidates.slice(0, limit).map(m => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        poster_url: m.poster_url,
        thumb_url: m.thumb_url,
        year: m.year,
        score: m.score
    }));

    strategy = recommendations.length > 0 ? 'content_based_recent_likes' : 'no_similar_found';

    return { recommendations, strategy };
}

export async function POST(request: NextRequest) {
    try {
        let userId: string | undefined;
        try {
            const body = await request.json();
            userId = body.userId;
        } catch (jsonError) {
             if (jsonError instanceof SyntaxError) { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
             return NextResponse.json({ error: "userId is required in body" }, { status: 400 });
        }

        if (!userId || typeof userId !== 'string') {
            return NextResponse.json({ error: "Valid userId (string) is required" }, { status: 400 });
        }

        const { recommendations, strategy } = await getRecommendationsBasedOnRecentLikes(userId);
        return NextResponse.json({ data: recommendations, strategy: strategy });

    } catch (error: unknown) {
        console.error("Recently Liked Recommendations API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: "Failed to fetch recommendations", details: errorMessage }, { status: 500 });
    }
}