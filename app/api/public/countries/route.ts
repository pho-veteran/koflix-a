import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const countries = await prisma.country.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
            },
            orderBy: {
                name: 'asc',
            }
        });

        return NextResponse.json({ data: countries });

    } catch (error: unknown) {
        console.error("Get Countries API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch countries", details: errorMessage },
            { status: 500 }
        );
    }
}