import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MovieResult } from "@/types/backendType";

// --- Configuration ---
const DEFAULT_LIMIT = 12;
const RECENT_DAYS_WINDOW = 7;

async function getRecentlyAddedMoviesByGenre(
    genreId: string,
    limit: number = DEFAULT_LIMIT
): Promise<{ recommendations: MovieResult[]; strategy: string }> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - RECENT_DAYS_WINDOW);

    // Find recent episodes for movies within the specified genre
    const recentEpisodes = await prisma.episode.findMany({
        where: {
            createdAt: { gte: sinceDate },
            movie: {
                genreIds: { has: genreId } 
            }
        },
        orderBy: { createdAt: 'desc' },
        select: { movieId: true, createdAt: true }
    });

    if (recentEpisodes.length === 0) {
        return { recommendations: [], strategy: `no_episodes_last_${RECENT_DAYS_WINDOW}_days_in_genre` };
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
         return { recommendations: [], strategy: 'no_movies_found_for_recent_episodes_in_genre' };
    }

    const recentMovies = await prisma.movie.findMany({
        where: {
            id: { in: movieIdsOrderedByRecentEpisode }
        },
        select: {
            id: true, name: true, slug: true, poster_url: true, thumb_url: true, year: true,
        }
    });

    const recommendations: MovieResult[] = movieIdsOrderedByRecentEpisode.flatMap(movieId => {
        const movie = recentMovies.find(m => m.id === movieId);
        if (!movie) return [];
        const result: MovieResult = {
            id: movie.id, name: movie.name, slug: movie.slug,
            poster_url: movie.poster_url, thumb_url: movie.thumb_url, year: movie.year,
        };
        return [result];
    });

    return {
        recommendations,
        strategy: `recently_updated_last_${RECENT_DAYS_WINDOW}_days_in_genre`
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: { genreId: string } }
) {
    try {
        const { genreId } = await params;
        
        if (!genreId) {
            return NextResponse.json({ error: "genreId is required" }, { status: 400 });
        }

        const url = new URL(request.url);
        let limit = DEFAULT_LIMIT;
        const limitParam = url.searchParams.get('limit');
        if (limitParam) {
            const parsedLimit = parseInt(limitParam, 10);
            if (!isNaN(parsedLimit) && parsedLimit > 0) {
                limit = Math.min(parsedLimit, 50);
            }
        }
        const genreExists = await prisma.genre.findUnique({
            where: { id: genreId },
            select: { id: true }
        });

        if (!genreExists) {
            return NextResponse.json({ error: `Genre with ID '${genreId}' not found` }, { status: 404 });
        }

        const { recommendations, strategy } = await getRecentlyAddedMoviesByGenre(genreId, limit);
        return NextResponse.json({ data: recommendations, strategy: strategy });

    } catch (error: unknown) {
        console.error("Recently Added By Genre Recommendations API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch recently added movies by genre", details: errorMessage },
            { status: 500 }
        );
    }
}