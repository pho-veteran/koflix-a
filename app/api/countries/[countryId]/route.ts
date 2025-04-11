import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: { countryId: string } }
) {
    try {
        const body = await req.json();
        const { countryId } = await params;

        const { name, slug } = body;

        if (!name || !slug) {
            return new NextResponse("Name and slug are required", {
                status: 400,
            });
        }

        if (!countryId) {
            return new NextResponse("Country ID is required", { status: 400 });
        }

        // Check for existing country with the same slug (but not this one)
        const existingCountry = await prisma.country.findFirst({
            where: {
                slug,
                id: {
                    not: countryId,
                },
            },
        });

        if (existingCountry) {
            return new NextResponse("Slug is already in use", { status: 400 });
        }

        const country = await prisma.country.update({
            where: {
                id: countryId,
            },
            data: {
                name,
                slug,
            },
        });

        return NextResponse.json(country);
    } catch (error) {
        console.log("[COUNTRY_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { countryId: string } }
) {
    try {
        const { countryId } = await params;

        if (!countryId) {
            return new NextResponse("Country ID is required", { status: 400 });
        }

        // Check if the country exists and get its movie associations
        const country = await prisma.country.findUnique({
            where: {
                id: countryId,
            },
            select: {
                movieIds: true,
            }
        });

        if (!country) {
            return new NextResponse("Country not found", { status: 404 });
        }

        // Check if the country is associated with any movies
        if (country.movieIds && country.movieIds.length > 0) {
            return new NextResponse(
                "Cannot delete country that is associated with movies. Remove all movie associations first.", 
                { status: 400 }
            );
        }

        // Delete the country since it has no movie associations
        await prisma.country.delete({
            where: {
                id: countryId,
            },
        });

        return NextResponse.json({ message: "Country deleted successfully" });
    } catch (error) {
        console.log("[COUNTRY_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: { countryId: string } }
) {
    try {
        const { countryId } = await params;

        if (!countryId) {
            return new NextResponse("Country ID is required", { status: 400 });
        }

        const country = await prisma.country.findUnique({
            where: {
                id: countryId,
            },
        });

        if (!country) {
            return new NextResponse("Country not found", { status: 404 });
        }

        return NextResponse.json(country);
    } catch (error) {
        console.log("[COUNTRY_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}