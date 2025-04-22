import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Create new episode
export async function POST(
    req: Request,
    { params }: { params: { movieId: string; episodeId: string } }
) {
    try {
        const body = await req.json();
        const { movieId } = params;

        // Validate request
        const { name, slug } = body;

        if (!name || !slug) {
            return new NextResponse("Name and slug are required", {
                status: 400,
            });
        }

        // Check that the movie exists
        const movie = await prisma.movie.findUnique({
            where: { id: movieId },
            select: { id: true }
        });

        if (!movie) {
            return new NextResponse("Movie not found", { status: 404 });
        }

        // Check if episode with same slug already exists for this movie
        const existingEpisode = await prisma.episode.findFirst({
            where: {
                movieId,
                slug,
            },
        });

        if (existingEpisode) {
            return new NextResponse("An episode with this slug already exists for this movie", { 
                status: 400 
            });
        }

        // Create the episode
        const episode = await prisma.episode.create({
            data: {
                name,
                slug,
                movieId,
            },
        });

        return NextResponse.json(episode);
    } catch (error) {
        console.error("[EPISODE_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// Update episode
export async function PATCH(
    req: Request,
    { params }: { params: { movieId: string; episodeId: string } }
) {
    try {
        const body = await req.json();
        const { movieId, episodeId } = params;

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
    { params }: { params: { movieId: string; episodeId: string } }
) {
    try {
        const { movieId, episodeId } = params;

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