import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InteractionType } from "@prisma/client";
import { MovieResult } from "@/types/backendType";
import { verifyUserToken } from "@/lib/server-auth";

// --- Configuration ---
const MIN_INTERACTIONS_FOR_COLLAB = 5; // Min positive interactions for collaborative filtering
const SIMILAR_USER_INTERACTION_OVERLAP = 3; // Min shared liked/rated movies to consider users similar
const USER_RECOMMENDATION_LIMIT = 10;
const POSITIVE_RATING_THRESHOLD = 4; // New threshold for 1-5 scale

async function getUserRecommendations(userId: string, limit: number = USER_RECOMMENDATION_LIMIT): Promise<{ recommendations: MovieResult[]; strategy: string }> {
    let recommendations: MovieResult[] = [];
    let strategy = 'popularity_fallback'; // Default

    // 1. Get target user's positive interactions (likes, high ratings)
    const userInteractions = await prisma.userInteraction.findMany({
        where: {
            userId,
            OR: [
                { interactionType: InteractionType.LIKE },
                // Use new threshold
                { interactionType: InteractionType.RATE, rating: { gte: POSITIVE_RATING_THRESHOLD } },
            ]
        },
        select: { movieId: true },
        orderBy: { timestamp: 'desc' },
        take: 100, // Consider recent history
    });

    const positiveMovieIds = [...new Set(userInteractions.map(i => i.movieId))];
    const allInteractedMovieIds = [...new Set((await prisma.userInteraction.findMany({
        where: { userId }, select: { movieId: true }, take: 200 // Get broader history for exclusion
    })).map(i => i.movieId))];


    // --- Cold Start Check ---
    if (positiveMovieIds.length < MIN_INTERACTIONS_FOR_COLLAB) {
        strategy = 'cold_start';
        // Fallback Strategy 1: Content-Based on limited history
        if (positiveMovieIds.length > 0) {
            const preferredFeatures = await prisma.movie.findMany({
                where: { id: { in: positiveMovieIds } },
                select: { genreIds: true, countryIds: true }
            });
            const preferredGenreIds = [...new Set(preferredFeatures.flatMap(m => m.genreIds))];
            const preferredCountryIds = [...new Set(preferredFeatures.flatMap(m => m.countryIds))];

            const contentBasedRecs = await prisma.movie.findMany({
                where: {
                    id: { notIn: allInteractedMovieIds },
                    OR: [
                        { genreIds: { hasSome: preferredGenreIds } },
                        { countryIds: { hasSome: preferredCountryIds } },
                    ]
                },
                take: limit,
                orderBy: { rating: 'desc' },
                select: { id: true, name: true, slug: true, poster_url: true, thumb_url: true, year: true }
            });
            if (contentBasedRecs.length > 0) {
                recommendations = contentBasedRecs.map(m => ({ ...m, score: 0 }));
                strategy = 'cold_start_content_based';
                return { recommendations, strategy };
            }
        }

        // Fallback Strategy 2: Popular Movies
        const popularMovies = await prisma.movie.findMany({
            where: { id: { notIn: allInteractedMovieIds } },
            orderBy: { view: 'desc' },
            take: limit,
            select: { id: true, name: true, slug: true, poster_url: true, thumb_url: true, year: true }
        });
        recommendations = popularMovies.map(m => ({ ...m, score: 0 }));
        strategy = 'cold_start_popular';
        return { recommendations, strategy };
    }

    // --- Strategy 1: Collaborative Filtering (User-Based) ---
    try {
        // Find users who interacted positively with the same movies as the target user
        const potentialSimilarUsers = await prisma.userInteraction.findMany({
            where: {
                movieId: { in: positiveMovieIds },
                userId: { not: userId }, // Exclude the target user
                OR: [
                    { interactionType: InteractionType.LIKE },
                    // Use new threshold
                    { interactionType: InteractionType.RATE, rating: { gte: POSITIVE_RATING_THRESHOLD } },
                ]
            },
            select: { userId: true, movieId: true },
            take: 1000, // Limit the search space for performance
        });

        // Group interactions by user
        const userInteractionMap = potentialSimilarUsers.reduce((acc, interaction) => {
            if (!acc[interaction.userId]) {
                acc[interaction.userId] = new Set();
            }
            acc[interaction.userId].add(interaction.movieId);
            return acc;
        }, {} as { [userId: string]: Set<string> });

        // Find users with significant overlap
        const similarUserIds = Object.entries(userInteractionMap)
            .map(([otherUserId, otherMovies]) => {
                const intersection = new Set([...positiveMovieIds].filter(id => otherMovies.has(id)));
                return { userId: otherUserId, overlap: intersection.size };
            })
            .filter(u => u.overlap >= SIMILAR_USER_INTERACTION_OVERLAP)
            .sort((a, b) => b.overlap - a.overlap) // Sort by overlap amount
            .slice(0, 50) // Limit number of similar users considered
            .map(u => u.userId);

        if (similarUserIds.length > 0) {
            // Find movies liked/rated highly by similar users
            const similarUserInteractions = await prisma.userInteraction.findMany({
                where: {
                    userId: { in: similarUserIds },
                    movieId: { notIn: allInteractedMovieIds }, // Exclude movies target user already interacted with
                    OR: [
                        { interactionType: InteractionType.LIKE },
                        // Use new threshold
                        { interactionType: InteractionType.RATE, rating: { gte: POSITIVE_RATING_THRESHOLD } },
                    ]
                },
                select: { movieId: true },
                // Fetch more candidates to rank later
                take: limit * 5,
            });

            // Count frequency of recommended movies
            const movieCounts = similarUserInteractions.reduce((acc, interaction) => {
                acc[interaction.movieId] = (acc[interaction.movieId] || 0) + 1;
                return acc;
            }, {} as { [movieId: string]: number });

            const recommendedMovieIds = Object.entries(movieCounts)
                .sort(([, countA], [, countB]) => countB - countA) // Sort by frequency
                .slice(0, limit * 2) // Take top candidates
                .map(([movieId]) => movieId);

            if (recommendedMovieIds.length > 0) {
                const recMovieDetails = await prisma.movie.findMany({
                    where: { id: { in: recommendedMovieIds } },
                    select: { id: true, name: true, slug: true, poster_url: true, thumb_url: true, year: true }
                });

                // Map back scores (frequency) and sort
                recommendations = recMovieDetails.map(movie => ({
                    ...movie,
                    score: movieCounts[movie.id] || 0
                })).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, limit);

                strategy = 'collaborative_user_based';
            }
        }
    } catch (error) {
        console.error("Collaborative filtering error:", error);
        // Proceed to content-based fallback if collaborative fails
    }


    // --- Strategy 2: Content-Based Fallback (if collaborative failed or insufficient) ---
    if (recommendations.length < limit) {
        const needed = limit - recommendations.length;
        const existingRecIds = recommendations.map(r => r.id);
        const excludeIds = [...new Set([...allInteractedMovieIds, ...existingRecIds])];

        // Use preferred features calculated earlier if available, otherwise recalculate
        const preferredFeatures = await prisma.movie.findMany({
            where: { id: { in: positiveMovieIds } },
            select: { genreIds: true, countryIds: true }
        });
        const preferredGenreIds = [...new Set(preferredFeatures.flatMap(m => m.genreIds))];
        const preferredCountryIds = [...new Set(preferredFeatures.flatMap(m => m.countryIds))];

        const contentBasedRecs = await prisma.movie.findMany({
            where: {
                id: { notIn: excludeIds },
                OR: [
                    { genreIds: { hasSome: preferredGenreIds } },
                    { countryIds: { hasSome: preferredCountryIds } },
                ]
            },
            take: needed,
            orderBy: { rating: 'desc' },
            select: { id: true, name: true, slug: true, poster_url: true, thumb_url: true, year: true }
        });

        recommendations.push(...contentBasedRecs.map(m => ({ ...m, score: 0 })));

        if (strategy === 'collaborative_user_based' && contentBasedRecs.length > 0) {
            strategy = 'collaborative_with_content_fallback';
        } else if (!strategy.startsWith('collaborative')) {
            strategy = recommendations.length > 0 ? 'content_based_fallback' : 'popularity_fallback'; // If still empty, will hit next block
        }
    }

    // --- Strategy 3: Popularity Fallback (if still needed) ---
     if (recommendations.length < limit) {
        const needed = limit - recommendations.length;
        const excludeIds = [...new Set([...allInteractedMovieIds, ...recommendations.map(r => r.id)])];

        const popularMovies = await prisma.movie.findMany({
            where: { id: { notIn: excludeIds } },
            orderBy: { view: 'desc' },
            take: needed,
            select: { id: true, name: true, slug: true, poster_url: true, thumb_url: true, year: true }
        });
        recommendations.push(...popularMovies.map(m => ({ ...m, score: 0 })));
        // Update strategy only if we haven't already determined a primary strategy
        if (strategy === 'popularity_fallback' || strategy === 'content_based_fallback') {
             strategy = recommendations.length > 0 ? 'popularity_fallback' : 'none';
        }
     }

    return { recommendations: recommendations.slice(0, limit), strategy };
}

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();
        
        if (!idToken) {
            return NextResponse.json({ error: "Authentication token required" }, { status: 401 });
        }

        const authResult = await verifyUserToken(idToken);

        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json(
                { error: authResult.error || "Authentication failed" },
                { status: 401 }
            );
        }

        const userId = authResult.userId;

        const { recommendations, strategy } = await getUserRecommendations(userId);
        return NextResponse.json({ data: recommendations, strategy: strategy });

    } catch (error: unknown) {
        console.error("User Recommendations API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: "Failed to fetch user recommendations", details: errorMessage }, { status: 500 });
    }
}