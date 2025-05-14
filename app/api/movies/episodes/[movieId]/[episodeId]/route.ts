import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Update episode
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ movieId: string; episodeId: string }> }
) {
    try {
        const body = await req.json();
        const { movieId, episodeId } = await params;

        // Validate request
        const { name, slug } = body;

        if (!name || !slug) {
            return new NextResponse("Name and slug are required", {
                status: 400,
            });
        }

        // Check if the episode exists
        const episode = await prisma.episode.findUnique({
            where: { id: episodeId },
            select: { id: true, movieId: true }
        });

        if (!episode) {
            return new NextResponse("Episode not found", { status: 404 });
        }

        // Verify episode belongs to the specified movie
        if (episode.movieId !== movieId) {
            return new NextResponse("Episode does not belong to this movie", { 
                status: 400 
            });
        }

        // Check if another episode with same slug already exists for this movie
        const existingEpisode = await prisma.episode.findFirst({
            where: {
                movieId,
                slug,
                id: { not: episodeId },
            },
        });

        if (existingEpisode) {
            return new NextResponse("Another episode with this slug already exists for this movie", { 
                status: 400 
            });
        }

        // Update the episode
        const updatedEpisode = await prisma.episode.update({
            where: { id: episodeId },
            data: {
                name,
                slug,
            },
        });

        return NextResponse.json(updatedEpisode);
    } catch (error) {
        console.error("[EPISODE_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// Delete episode
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ movieId: string; episodeId: string }> }
) {
    try {
        const { movieId, episodeId } = await params;

        // Check if the episode exists
        const episode = await prisma.episode.findUnique({
            where: { id: episodeId },
            select: { id: true, movieId: true }
        });

        if (!episode) {
            return new NextResponse("Episode not found", { status: 404 });
        }

        // Verify episode belongs to the specified movie
        if (episode.movieId !== movieId) {
            return new NextResponse("Episode does not belong to this movie", { 
                status: 400 
            });
        }

        // Delete the episode (cascades to servers automatically)
        await prisma.episode.delete({
            where: { id: episodeId },
        });

        return NextResponse.json({ message: "Episode deleted successfully" });
    } catch (error) {
        console.error("[EPISODE_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ movieId: string; episodeId: string }> }
) {
    try {
        const body = await req.json();
        const { movieId, episodeId } = await params;

        // Validate request with link_mp4
        const { server_name, filename, link_embed, link_m3u8, link_mp4 } = body;

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

        // Create the server with link_mp4
        const server = await prisma.episodeServer.create({
            data: {
                server_name,
                filename: filename || null,
                link_embed: link_embed || null,
                link_m3u8: link_m3u8 || null,
                link_mp4: link_mp4 || null,
                episodeId,
            },
        });

        return NextResponse.json(server);
    } catch (error) {
        console.error("[EPISODE_SERVER_NEW]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}