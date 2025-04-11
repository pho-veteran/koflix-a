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

        const existingCountry = await prisma.country.findUnique({
            where: {
                slug,
            },
        });

        if (existingCountry) {
            return new NextResponse("Slug is already in use", { status: 400 });
        }

        const country = await prisma.country.create({
            data: {
                name,
                slug,
            },
        });

        return NextResponse.json(country);
    } catch (error) {
        console.log("[COUNTRIES_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function GET() {
    try {
        const countries = await prisma.country.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(countries);
    } catch (error) {
        console.log("[COUNTRIES_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}