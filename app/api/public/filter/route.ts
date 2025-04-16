import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { MovieResult } from "@/types/backendType";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Validate if a value is an array of strings
function isStringArray(value: unknown): value is string[] { // 
    return Array.isArray(value) && value.every(item => typeof item === 'string');
}

export async function POST(request: NextRequest) {
    try {
        // 1. Parse Request Body
        let body;
        try {
            body = await request.json();
            console.log("Received filter request body:", JSON.stringify(body, null, 2));
        } catch (error) {
            console.error("Failed to parse JSON body:", error);
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        // 2. Extract and Validate Parameters
        const typeId = body.typeId;
        const genreIds = body.genreIds;
        const countryId = body.countryId;
        const startYearParam = body.startYear;
        const endYearParam = body.endYear;
        const nameParam = body.name;
        const pageParam = body.page ?? 1;
        const limitParam = body.limit ?? DEFAULT_LIMIT;

        // --- Input Validation ---
        if (typeId !== undefined && typeof typeId !== 'string') {
             return NextResponse.json({ error: "Invalid 'typeId' parameter. Must be a string." }, { status: 400 });
        }
        if (genreIds !== undefined && !isStringArray(genreIds)) {
            return NextResponse.json({ error: "Invalid 'genreIds' parameter. Must be an array of strings." }, { status: 400 });
        }
        if (countryId !== undefined && typeof countryId !== 'string') {
             return NextResponse.json({ error: "Invalid 'countryId' parameter. Must be a string." }, { status: 400 });
        }

        let startYear: number | undefined;
        let endYear: number | undefined;

        if (startYearParam !== undefined) {
            startYear = Number(startYearParam);
            if (isNaN(startYear)) {
                return NextResponse.json({ error: "Invalid 'startYear' parameter. Must be a number." }, { status: 400 });
            }
        }

        if (endYearParam !== undefined) {
            endYear = Number(endYearParam);
            if (isNaN(endYear)) {
                return NextResponse.json({ error: "Invalid 'endYear' parameter. Must be a number." }, { status: 400 });
            }
        }

        let page = Number(pageParam);
        let limit = Number(limitParam);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
        limit = Math.min(limit, MAX_LIMIT);

        // Construct WHERE Clause
        const where: Prisma.MovieWhereInput = {};

        if (typeId) {
            where.typeId = typeId;
        }

        if (genreIds && genreIds.length > 0) {
            where.genreIds = { hasEvery: genreIds };
        }

        if (countryId) {
            where.countryIds = { has: countryId };
        }

        if (startYear !== undefined || endYear !== undefined) {
            where.year = {};
            if (startYear !== undefined) {
                 console.log(`Applying filter: year >= ${startYear}`);
                 where.year.gte = startYear;
            }
            if (endYear !== undefined) {
                 console.log(`Applying filter: year <= ${endYear}`);
                 where.year.lte = endYear;
            }
        }

        if (nameParam && typeof nameParam === 'string' && nameParam.trim() !== '') {
            where.name = {
                contains: nameParam.trim(),
                mode: 'insensitive',
            };
        }

        // Execute Database Query
        const [movies, totalCount] = await prisma.$transaction([
            prisma.movie.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    poster_url: true,
                    thumb_url: true,
                    year: true,
                    genres: { select: { name: true } },
                    updatedAt: true,
                }
            }),
            prisma.movie.count({ where })
        ]);

        // Format and Return Response
        const formattedMovies: MovieResult[] = movies.map(movie => ({
            id: movie.id,
            name: movie.name,
            slug: movie.slug,
            poster_url: movie.poster_url,
            thumb_url: movie.thumb_url,
            year: movie.year,
            genres: movie.genres.map(g => g.name),
        }));

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            data: formattedMovies,
            pagination: {
                currentPage: page,
                limit: limit,
                totalPages: totalPages,
                totalCount: totalCount,
            }
        });

    } catch (error: unknown) {
        // Handle Errors
        console.error("Filter Movies API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch filtered movies", details: errorMessage },
            { status: 500 }
        );
    }
}