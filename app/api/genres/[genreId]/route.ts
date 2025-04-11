import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: { genreId: string } }
) {
    try {
        const body = await req.json();
        const { genreId } = await params;

        const { name, slug } = body;

        if (!name || !slug) {
            return new NextResponse("Name and slug are required", {
                status: 400,
            });
        }

        if (!genreId) {
            return new NextResponse("Genre ID is required", { status: 400 });
        }

        // Check for existing genre with the same slug (but not this one)
        const existingGenre = await prisma.genre.findFirst({
            where: {
                slug,
                id: {
                    not: genreId,
                },
            },
        });

        if (existingGenre) {
            return new NextResponse("Slug is already in use", { status: 400 });
        }

        const genre = await prisma.genre.update({
            where: {
                id: genreId,
            },
            data: {
                name,
                slug,
            },
        });

        return NextResponse.json(genre);
    } catch (error) {
        console.log("[GENRE_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { genreId: string } }
) {
    try {
        const { genreId } = await params;

        if (!genreId) {
            return new NextResponse("Genre ID is required", { status: 400 });
        }

        // Check if the genre exists and get its movie associations
        const genre = await prisma.genre.findUnique({
            where: {
                id: genreId,
            },
            select: {
                movieIds: true,
            }
        });

        if (!genre) {
            return new NextResponse("Genre not found", { status: 404 });
        }

        // Check if the genre is associated with any movies
        if (genre.movieIds && genre.movieIds.length > 0) {
            return new NextResponse(
                "Cannot delete genre that is associated with movies. Remove all movie associations first.", 
                { status: 400 }
            );
        }

        // Delete the genre since it has no movie associations
        await prisma.genre.delete({
            where: {
                id: genreId,
            },
        });

        return NextResponse.json({ message: "Genre deleted successfully" });
    } catch (error) {
        console.log("[GENRE_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: { genreId: string } }
) {
    try {
        const { genreId } = await params; // Await params

        if (!genreId) {
            return new NextResponse("Genre ID is required", { status: 400 });
        }

        const genre = await prisma.genre.findUnique({
            where: {
                id: genreId,
            },
        });

        if (!genre) {
            return new NextResponse("Genre not found", { status: 404 });
        }

        return NextResponse.json(genre);
    } catch (error) {
        console.log("[GENRE_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
