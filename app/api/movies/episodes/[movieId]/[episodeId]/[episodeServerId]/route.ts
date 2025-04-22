import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Create new episode server
export async function POST(
    req: Request,
    { params }: { params: { movieId: string; episodeId: string; episodeServerId: string } }
) {
    try {
        const body = await req.json();
        const { movieId, episodeId } = params;

        // Validate request
        const { server_name, filename, link_embed, link_m3u8 } = body;

        if (!server_name) {
            return new NextResponse("Server name is required", {
                status: 400,
            });
        }

        // Verify episode exists and belongs to the movie
        const episode = await prisma.episode.findFirst({
            where: {
                id: episodeId,
                movieId,
            },
        });

        if (!episode) {
            return new NextResponse("Episode not found or does not belong to this movie", {
                status: 404,
            });
        }

        // Check if server with same name already exists for this episode
        const existingServer = await prisma.episodeServer.findFirst({
            where: {
                episodeId,
                server_name,
            },
        });

        if (existingServer) {
            return new NextResponse("A server with this name already exists for this episode", {
                status: 400,
            });
        }

        // Create the server
        const server = await prisma.episodeServer.create({
            data: {
                server_name,
                filename: filename || null,
                link_embed: link_embed || null,
                link_m3u8: link_m3u8 || null,
                episodeId,
            },
        });

        return NextResponse.json(server);
    } catch (error) {
        console.error("[EPISODE_SERVER_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// Update episode server
export async function PATCH(
    req: Request,
    { params }: { params: { movieId: string; episodeId: string; episodeServerId: string } }
) {
    try {
        const body = await req.json();
        const { movieId, episodeId, episodeServerId } = params;

        // Validate request
        const { server_name, filename, link_embed, link_m3u8 } = body;

        if (!server_name) {
            return new NextResponse("Server name is required", {
                status: 400,
            });
        }

        // Verify episode exists and belongs to the movie
        const episode = await prisma.episode.findFirst({
            where: {
                id: episodeId,
                movieId,
            },
        });

        if (!episode) {
            return new NextResponse("Episode not found or does not belong to this movie", {
                status: 404,
            });
        }

        // Verify server exists and belongs to the episode
        const server = await prisma.episodeServer.findFirst({
            where: {
                id: episodeServerId,
                episodeId,
            },
        });

        if (!server) {
            return new NextResponse("Server not found or does not belong to this episode", {
                status: 404,
            });
        }

        // Check if another server with same name already exists for this episode
        const existingServer = await prisma.episodeServer.findFirst({
            where: {
                episodeId,
                server_name,
                id: { not: episodeServerId },
            },
        });

        if (existingServer) {
            return new NextResponse("Another server with this name already exists for this episode", {
                status: 400,
            });
        }

        // Update the server
        const updatedServer = await prisma.episodeServer.update({
            where: { id: episodeServerId },
            data: {
                server_name,
                filename: filename || null,
                link_embed: link_embed || null,
                link_m3u8: link_m3u8 || null,
            },
        });

        return NextResponse.json(updatedServer);
    } catch (error) {
        console.error("[EPISODE_SERVER_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// Delete episode server
export async function DELETE(
    req: Request,
    { params }: { params: { movieId: string; episodeId: string; episodeServerId: string } }
) {
    try {
        const { movieId, episodeId, episodeServerId } = params;

        // Verify episode exists and belongs to the movie
        const episode = await prisma.episode.findFirst({
            where: {
                id: episodeId,
                movieId,
            },
        });

        if (!episode) {
            return new NextResponse("Episode not found or does not belong to this movie", {
                status: 404,
            });
        }

        // Verify server exists and belongs to the episode
        const server = await prisma.episodeServer.findFirst({
            where: {
                id: episodeServerId,
                episodeId,
            },
        });

        if (!server) {
            return new NextResponse("Server not found or does not belong to this episode", {
                status: 404,
            });
        }

        // Delete the server
        await prisma.episodeServer.delete({
            where: { id: episodeServerId },
        });

        return NextResponse.json({ message: "Server deleted successfully" });
    } catch (error) {
        console.error("[EPISODE_SERVER_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}