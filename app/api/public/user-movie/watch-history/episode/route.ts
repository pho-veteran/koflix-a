import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyUserToken } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { episodeId, idToken } = body;

        // Validate
        if (!episodeId) {
            return NextResponse.json({ error: "Episode ID is required" }, { status: 400 });
        }

        if (!idToken) {
            return NextResponse.json({ error: "Authentication token is required" }, { status: 401 });
        }

        // Authenticate user
        const authResult = await verifyUserToken(idToken);
        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json(
                { error: authResult.error || "Authentication failed" },
                { status: 401 }
            );
        }

        const userId = authResult.userId;

        // Check if the episode exists (only fetch the ID)
        const episodeExists = await prisma.episode.findUnique({
            where: { id: episodeId },
            select: { id: true }
        });

        if (!episodeExists) {
            return NextResponse.json({ error: `Episode with ID ${episodeId} not found` }, { status: 404 });
        }

        // Fetch watch history for the specific episode and user
        const watchHistory = await prisma.watchHistory.findMany({
            where: {
                userId: userId,
                episodeServer: {
                    episodeId: episodeId
                }
            },
            include: {
                episodeServer: {
                    select: {
                        id: true,
                        server_name: true
                    }
                }
            },
            orderBy: {
                watchedAt: 'desc'
            }
        });

        // Process watch history to make it more client-friendly
        const formattedWatchHistory = watchHistory.map(item => ({
            id: item.id,
            progress: item.progress,
            durationWatched: item.durationWatched,
            watchedAt: item.watchedAt,
            episodeServerId: item.episodeServer.id,
            serverName: item.episodeServer.server_name
        }));

        return NextResponse.json({
            success: true,
            data: {
                episodeId: episodeExists.id,
                watchHistory: formattedWatchHistory
            }
        });

    } catch (error: unknown) {
        console.error("Get Episode Watch History API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch episode watch history", details: errorMessage },
            { status: 500 }
        );
    }
}