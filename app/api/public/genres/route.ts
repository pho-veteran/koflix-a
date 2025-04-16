import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const genres = await prisma.genre.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
            },
            orderBy: {
                name: 'asc',
            } 
        });

        return NextResponse.json({ data: genres });

    } catch (error: unknown) {
        console.error("Get Genres API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch genres", details: errorMessage },
            { status: 500 }
        );
    }
}