import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InteractionType } from "@prisma/client";
import { MovieResult } from "@/types/backendType";
import { verifyUserToken } from "@/lib/server-auth";

// --- Configuration ---
const RECENT_VIEWS_LIMIT = 25;
const RECOMMENDATION_LIMIT = 10;

async function getRecommendationsBasedOnRecentViews(userId: string, limit: number = RECOMMENDATION_LIMIT): Promise<{ recommendations: MovieResult[]; strategy: string }> {
    let recommendations: MovieResult[] = [];
    let strategy = 'popularity_fallback';

    // 1. Get user's recent VIEW interactions
    const recentViews = await prisma.userInteraction.findMany({
        where: {
            userId,
            interactionType: InteractionType.VIEW,
        },
        select: { movieId: true, timestamp: true },
        orderBy: { timestamp: 'desc' },
        take: RECENT_VIEWS_LIMIT,
    });

    // Get unique movie IDs from recent views
    const viewedMovieIds = [...new Set(recentViews.map(i => i.movieId))];

    if (viewedMovieIds.length === 0) {
        strategy = 'no_recent_views';
        return { recommendations, strategy };
    }

    // 2. Get features (genres, countries) of viewed movies
    const viewedMoviesFeatures = await prisma.movie.findMany({
        where: { id: { in: viewedMovieIds } },
        select: { genreIds: true, countryIds: true }
    });
    const preferredGenreIds = [...new Set(viewedMoviesFeatures.flatMap(m => m.genreIds))];
    const preferredCountryIds = [...new Set(viewedMoviesFeatures.flatMap(m => m.countryIds))];

    // 3. Get all movies user has interacted with (for exclusion)
    const allInteractedMovieIds = [...new Set((await prisma.userInteraction.findMany({
        where: { userId }, select: { movieId: true }, take: 500 // Broader history for exclusion
    })).map(i => i.movieId))];

    // 4. Find candidate movies based on shared features
    const candidates = await prisma.movie.findMany({
        where: {
            id: { notIn: allInteractedMovieIds }, 
            OR: [
                { genreIds: { hasSome: preferredGenreIds } },
                { countryIds: { hasSome: preferredCountryIds } },
            ]
        },
        take: limit * 5,
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

    strategy = recommendations.length > 0 ? 'content_based_recent_views' : 'no_similar_found';

    return { recommendations, strategy };
}

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();
        
        if (!idToken) {
            return NextResponse.json(
                { error: "Authentication token required" }, 
                { status: 401 }
            );
        }

        const authResult = await verifyUserToken(idToken);

        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json(
                { error: authResult.error || "Authentication failed" },
                { status: 401 }
            );
        }

        const userId = authResult.userId;

        const { recommendations, strategy } = await getRecommendationsBasedOnRecentViews(userId);
        return NextResponse.json({ data: recommendations, strategy: strategy });

    } catch (error: unknown) {
        console.error("Recently Watched Recommendations API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: "Failed to fetch recommendations", details: errorMessage }, { status: 500 });
    }
}