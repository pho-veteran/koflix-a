import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const types = await prisma.movieType.findMany({
            select: {
                id: true,
                name: true,
                slug: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({ data: types });

    } catch (error: unknown) {
        console.error("Get Movie Types API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch movie types", details: errorMessage },
            { status: 500 }
        );
    }
}