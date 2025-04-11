import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: { movieTypeId: string } }
) {
    try {
        const body = await req.json();
        const { movieTypeId } = await params;

        const { name, slug } = body;

        if (!name || !slug) {
            return new NextResponse("Name and slug are required", {
                status: 400,
            });
        }

        if (!movieTypeId) {
            return new NextResponse("Movie Type ID is required", { status: 400 });
        }

        // Check for existing movie type with the same slug (but not this one)
        const existingMovieType = await prisma.movieType.findFirst({
            where: {
                slug,
                id: {
                    not: movieTypeId,
                },
            },
        });

        if (existingMovieType) {
            return new NextResponse("Slug is already in use", { status: 400 });
        }

        const movieType = await prisma.movieType.update({
            where: {
                id: movieTypeId,
            },
            data: {
                name,
                slug,
            },
        });

        return NextResponse.json(movieType);
    } catch (error) {
        console.log("[MOVIE_TYPE_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { movieTypeId: string } }
) {
    try {
        const { movieTypeId } = await params;

        if (!movieTypeId) {
            return new NextResponse("Movie Type ID is required", { status: 400 });
        }

        // Check if the movie type exists and get its movie associations
        const movieType = await prisma.movieType.findUnique({
            where: {
                id: movieTypeId,
            },
            include: {
                movies: true
            }
        });

        if (!movieType) {
            return new NextResponse("Movie type not found", { status: 404 });
        }

        // Check if the movie type is associated with any movies
        if (movieType.movies && movieType.movies.length > 0) {
            return new NextResponse(
                "Cannot delete movie type that is associated with movies. Remove all movie associations first.", 
                { status: 400 }
            );
        }

        // Delete the movie type since it has no movie associations
        await prisma.movieType.delete({
            where: {
                id: movieTypeId,
            },
        });

        return NextResponse.json({ message: "Movie type deleted successfully" });
    } catch (error) {
        console.log("[MOVIE_TYPE_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: { movieTypeId: string } }
) {
    try {
        const { movieTypeId } = await params; // Await params

        if (!movieTypeId) {
            return new NextResponse("Movie Type ID is required", { status: 400 });
        }

        const movieType = await prisma.movieType.findUnique({
            where: {
                id: movieTypeId,
            },
        });

        if (!movieType) {
            return new NextResponse("Movie type not found", { status: 404 });
        }

        return NextResponse.json(movieType);
    } catch (error) {
        console.log("[MOVIE_TYPE_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
