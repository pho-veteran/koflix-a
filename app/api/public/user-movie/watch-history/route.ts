import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyUserToken } from "@/lib/server-auth";
import { Prisma } from "@prisma/client";

const DEFAULT_HISTORY_LIMIT = 20;
const MAX_HISTORY_LIMIT = 50;

interface WatchHistoryPostBody {
    idToken?: string;
    movieId?: string;
    episodeServerId?: string;
    progress?: number;
    durationWatched?: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: WatchHistoryPostBody = await request.json();

        const { idToken, movieId, episodeServerId, progress, durationWatched } =
            body;

        // --- Validation ---
        if (!idToken) {
            return NextResponse.json(
                { error: "Authentication token required" },
                { status: 401 }
            );
        }
        if (!movieId || typeof movieId !== "string") {
            return NextResponse.json(
                { error: "Valid movieId is required" },
                { status: 400 }
            );
        }
        if (!episodeServerId || typeof episodeServerId !== "string") {
            return NextResponse.json(
                { error: "Valid episodeServerId is required" },
                { status: 400 }
            );
        }
        if (
            progress === undefined ||
            typeof progress !== "number" ||
            progress < 0
        ) {
            return NextResponse.json(
                { error: "Valid progress is required" },
                { status: 400 }
            );
        }
        if (
            durationWatched !== undefined &&
            (typeof durationWatched !== "number" || durationWatched < 0)
        ) {
            return NextResponse.json(
                { error: "Invalid durationWatched format" },
                { status: 400 }
            );
        }

        // --- Authentication ---
        const authResult = await verifyUserToken(idToken);
        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json(
                { error: authResult.error || "Authentication failed" },
                { status: 401 }
            );
        }
        const userId = authResult.userId;

        // --- Check Existence (Movie/EpisodeServer) ---
        // Check Movie first
        const movieExists = await prisma.movie.findUnique({
            where: { id: movieId },
            select: { id: true },
        });
        if (!movieExists) {
            return NextResponse.json(
                { error: `Movie with ID ${movieId} not found` },
                { status: 404 }
            );
        }

        // Check EpisodeServer and its relation to the movie
        const episodeServerExists = await prisma.episodeServer.findUnique({
            where: { id: episodeServerId },
            select: {
                id: true,
                episode: {
                    select: { movieId: true },
                },
            },
        });

        if (!episodeServerExists) {
            return NextResponse.json(
                { error: `EpisodeServer with ID ${episodeServerId} not found` },
                { status: 404 }
            );
        }
        // Verify the episode server belongs to the correct movie
        if (episodeServerExists.episode.movieId !== movieId) {
            return NextResponse.json(
                {
                    error: `EpisodeServer ${episodeServerId} does not belong to movie ${movieId}`,
                },
                { status: 400 }
            );
        }

        // --- Create or Update Watch History ---
        const existingEntry = await prisma.watchHistory.findUnique({
            where: {
                userId_movieId_episodeServerId: {
                    userId,
                    movieId,
                    episodeServerId,
                },
            },
        });

        const watchData = {
            userId,
            movieId,
            episodeServerId,
            progress,
            durationWatched:
                durationWatched !== undefined
                    ? (existingEntry?.durationWatched || 0) + durationWatched
                    : undefined,
            watchedAt: new Date(),
        };

        let savedEntry;

        if (existingEntry) {
            savedEntry = await prisma.watchHistory.update({
                where: { id: existingEntry.id },
                data: watchData,
            });
        } else {
            savedEntry = await prisma.watchHistory.create({
                data: watchData,
            });
        }

        return NextResponse.json(
            { success: true, watchHistory: savedEntry },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Update Watch History API Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                return NextResponse.json(
                    {
                        error: "Unique constraint failed. Watch history entry might already exist.",
                    },
                    { status: 409 }
                );
            }
        }
        if (error instanceof SyntaxError && error.message.includes("JSON")) {
            return NextResponse.json(
                { error: "Invalid JSON body" },
                { status: 400 }
            );
        }
        const errorMessage =
            error instanceof Error
                ? error.message
                : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to update watch history", details: errorMessage },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const pageParam = url.searchParams.get("page") ?? "1";
        const limitParam =
            url.searchParams.get("limit") ?? String(DEFAULT_HISTORY_LIMIT);

        // --- Authentication ---
        const authorizationHeader = request.headers.get("Authorization");
        if (
            !authorizationHeader ||
            !authorizationHeader.startsWith("Bearer ")
        ) {
            return NextResponse.json(
                { error: "Authorization header is missing or invalid" },
                { status: 401 }
            );
        }
        const idToken = authorizationHeader.split(" ")[1];

        const authResult = await verifyUserToken(idToken);
        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json(
                { error: authResult.error || "Authentication failed" },
                { status: 401 }
            );
        }
        const userId = authResult.userId;

        // --- Validation ---
        let page = parseInt(pageParam, 10);
        let limit = parseInt(limitParam, 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = DEFAULT_HISTORY_LIMIT;
        limit = Math.min(limit, MAX_HISTORY_LIMIT);

        // --- Construct Query ---
        const where: Prisma.WatchHistoryWhereInput = {
            userId: userId,
        };

        // --- Fetch History & Count ---
        const [historyEntries, totalCount] = await prisma.$transaction([
            prisma.watchHistory.findMany({
                where,
                include: {
                    movie: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            poster_url: true,
                            thumb_url: true,
                            year: true,
                            episode_total: true,
                        },
                    },
                    episodeServer: {
                        select: {
                            id: true,
                            server_name: true,
                            filename: true,
                            episode: {
                                select: { id: true, name: true, slug: true },
                            },
                        },
                    },
                },
                orderBy: { watchedAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.watchHistory.count({ where }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        // Format data for response
        const formattedHistory = historyEntries.map((entry) => ({
            id: entry.id,
            progress: entry.progress,
            durationWatched: entry.durationWatched,
            watchedAt: entry.watchedAt,
            movie: entry.movie,

            episodeServer: {
                id: entry.episodeServer.id,
                server_name: entry.episodeServer.server_name,
                filename: entry.episodeServer.filename,
                episode: entry.episodeServer.episode,
            },
        }));

        return NextResponse.json({
            data: formattedHistory,
            pagination: {
                currentPage: page,
                limit: limit,
                totalPages: totalPages,
                totalCount: totalCount,
            },
        });
    } catch (error: unknown) {
        console.error("Get Watch History API Error:", error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch watch history", details: errorMessage },
            { status: 500 }
        );
    }
}
