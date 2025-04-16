import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MovieResult } from "@/types/backendType"; // Adjust path if needed

// --- Configuration ---
const DEFAULT_LIMIT = 12; // Number of movies to return
const RECENT_DAYS_WINDOW = 7; // Look for episodes added in the last 7 days

async function getRecentlyAddedMovies(
    limit: number = DEFAULT_LIMIT
): Promise<{ recommendations: MovieResult[]; strategy: string }> {

    // 1. Calculate the date for the start of the window
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - RECENT_DAYS_WINDOW);

    // 2. Find all episodes created within the time window
    const recentEpisodes = await prisma.episode.findMany({
        where: {
            createdAt: {
                gte: sinceDate, // Filter episodes created on or after the calculated date
            }
        },
        orderBy: {
            createdAt: 'desc', // Still useful for grouping logic later
        },
        // No 'take' limit on episodes anymore
        select: {
            movieId: true,
            createdAt: true, // Keep createdAt to find the latest update per movie
        }
    });

    if (recentEpisodes.length === 0) {
        return { recommendations: [], strategy: `no_episodes_last_${RECENT_DAYS_WINDOW}_days` };
    }

    // 3. Group by movieId and find the latest episode creation time for each movie within the window
    const latestEpisodeTimeByMovie = recentEpisodes.reduce((acc, episode) => {
        // Since we ordered by desc, the first time we see a movieId, it has the latest date
        if (!acc[episode.movieId]) {
            acc[episode.movieId] = episode.createdAt;
        }
        return acc;
    }, {} as { [movieId: string]: Date });

    // 4. Get the unique movie IDs, ordered by the most recent episode time
    const movieIdsOrderedByRecentEpisode = Object.entries(latestEpisodeTimeByMovie)
        .sort(([, dateA], [, dateB]) => dateB.getTime() - dateA.getTime()) // Sort movies by latest episode date
        .map(([movieId]) => movieId)
        .slice(0, limit); // Apply the limit to the number of *movies*

    if (movieIdsOrderedByRecentEpisode.length === 0) {
         // This case is less likely now but kept for safety
         return { recommendations: [], strategy: 'no_movies_found_for_recent_episodes' };
    }

    // 5. Fetch the movie details for these IDs
    const recentMovies = await prisma.movie.findMany({
        where: {
            id: { in: movieIdsOrderedByRecentEpisode }
        },
        select: {
            id: true,
            name: true,
            slug: true,
            poster_url: true,
            thumb_url: true,
            year: true,
        }
    });

    // 6. Re-order the fetched movies using flatMap and map to MovieResult type
    const recommendations: MovieResult[] = movieIdsOrderedByRecentEpisode.flatMap(movieId => {
        const movie = recentMovies.find(m => m.id === movieId);
        if (!movie) {
            return []; // Return empty array if movie not found (flatMap will skip it)
        }
        // Construct and return the MovieResult object within an array
        const result: MovieResult = {
            id: movie.id,
            name: movie.name,
            slug: movie.slug,
            poster_url: movie.poster_url,
            thumb_url: movie.thumb_url,
            year: movie.year,
        };
        return [result]; // Return as a single-element array
    });

    return {
        recommendations,
        strategy: `recently_updated_last_${RECENT_DAYS_WINDOW}_days` // Updated strategy name
    };
}

// POST handler remains the same
export async function POST(request: NextRequest) {
    try {
        let limit = DEFAULT_LIMIT;
        try {
            const body = await request.json();
            if (body.limit && typeof body.limit === 'number' && body.limit > 0) {
                limit = Math.min(body.limit, 50);
            }
        } catch (jsonError) {
            if (!(jsonError instanceof SyntaxError)) {
                 throw jsonError;
            }
        }

        const { recommendations, strategy } = await getRecentlyAddedMovies(limit);
        return NextResponse.json({ data: recommendations, strategy: strategy });

    } catch (error: unknown) {
        console.error("Recently Added Recommendations API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch recently added movies", details: errorMessage },
            { status: 500 }
        );
    }
}