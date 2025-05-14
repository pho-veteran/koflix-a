import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MovieFrontEndResult } from "@/types/backendType";

// --- Configuration ---
const DEFAULT_LIMIT = 12;
const RECENT_DAYS_WINDOW = 7;

async function getRecentlyAddedMoviesByType(
    typeId: string,
    limit: number = DEFAULT_LIMIT
): Promise<{ recommendations: MovieFrontEndResult[]; strategy: string }> {

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - RECENT_DAYS_WINDOW);

    // Find recent episodes for movies within the specified type
    const recentEpisodes = await prisma.episode.findMany({
        where: {
            createdAt: { gte: sinceDate },
            movie: {
                typeId: typeId
            }
        },
        orderBy: { createdAt: 'desc' },
        select: { movieId: true, createdAt: true }
    });

    if (recentEpisodes.length === 0) {
        return { recommendations: [], strategy: `no_episodes_last_${RECENT_DAYS_WINDOW}_days_in_type` };
    }

    const latestEpisodeTimeByMovie = recentEpisodes.reduce((acc, episode) => {
        if (!acc[episode.movieId]) {
            acc[episode.movieId] = episode.createdAt;
        }
        return acc;
    }, {} as { [movieId: string]: Date });

    const movieIdsOrderedByRecentEpisode = Object.entries(latestEpisodeTimeByMovie)
        .sort(([, dateA], [, dateB]) => dateB.getTime() - dateA.getTime())
        .map(([movieId]) => movieId)
        .slice(0, limit);

    if (movieIdsOrderedByRecentEpisode.length === 0) {
         return { recommendations: [], strategy: 'no_movies_found_for_recent_episodes_in_type' };
    }

    const recentMovies = await prisma.movie.findMany({
        where: {
            id: { in: movieIdsOrderedByRecentEpisode }
        },
        select: {
            id: true, name: true, slug: true, poster_url: true, thumb_url: true, year: true,
        }
    });

    const recommendations: MovieFrontEndResult[] = movieIdsOrderedByRecentEpisode.flatMap(movieId => {
        const movie = recentMovies.find(m => m.id === movieId);
        if (!movie) return [];
        const result: MovieFrontEndResult = {
            id: movie.id, name: movie.name, slug: movie.slug,
            poster_url: movie.poster_url, thumb_url: movie.thumb_url, year: movie.year,
        };
        return [result];
    });

    return {
        recommendations,
        strategy: `recently_updated_last_${RECENT_DAYS_WINDOW}_days_in_type`
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ typeId: string }> }
) {
    try {
        const { typeId } = await params;
        
        if (!typeId) {
            return NextResponse.json({ error: "typeId is required" }, { status: 400 });
        }

        // Parse limit from query parameters
        const url = new URL(request.url);
        let limit = DEFAULT_LIMIT;
        const limitParam = url.searchParams.get('limit');
        if (limitParam) {
            const parsedLimit = parseInt(limitParam, 10);
            if (!isNaN(parsedLimit) && parsedLimit > 0) {
                limit = Math.min(parsedLimit, 50);
            }
        }

        // Verify that the type exists
        const typeExists = await prisma.movieType.findUnique({
            where: { id: typeId },
            select: { id: true }
        });

        if (!typeExists) {
            return NextResponse.json({ error: `Type with ID '${typeId}' not found` }, { status: 404 });
        }

        const { recommendations, strategy } = await getRecentlyAddedMoviesByType(typeId, limit);
        return NextResponse.json({ data: recommendations, strategy: strategy });

    } catch (error: unknown) {
        console.error("Recently Added By Type Recommendations API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch recently added movies by type", details: errorMessage },
            { status: 500 }
        );
    }
}