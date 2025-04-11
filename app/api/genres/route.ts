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

        const existingGenre = await prisma.genre.findUnique({
            where: {
                slug,
            },
        });

        if (existingGenre) {
            return new NextResponse("Slug is already in use", { status: 400 });
        }

        const genre = await prisma.genre.create({
            data: {
                name,
                slug,
            },
        });

        return NextResponse.json(genre);
    } catch (error) {
        console.log("[GENRES_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function GET() {
    try {
        const genres = await prisma.genre.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(genres);
    } catch (error) {
        console.log("[GENRES_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
