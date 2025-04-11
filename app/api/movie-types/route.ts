import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { name, slug } = body;

        if (!name || !slug) {
            return new NextResponse("Name and slug are required", {
                status: 400,
            });
        }

        const existingMovieType = await prisma.movieType.findUnique({
            where: {
                slug,
            },
        });

        if (existingMovieType) {
            return new NextResponse("Slug is already in use", { status: 400 });
        }

        const movieType = await prisma.movieType.create({
            data: {
                name,
                slug,
            },
        });

        return NextResponse.json(movieType);
    } catch (error) {
        console.log("[MOVIE_TYPES_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function GET() {
    try {
        const movieTypes = await prisma.movieType.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(movieTypes);
    } catch (error) {
        console.log("[MOVIE_TYPES_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
