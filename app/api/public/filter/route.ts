import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { MovieFrontEndResult } from "@/types/backendType";
import { performVectorSearch } from "@/lib/atlas-search";
import { generateEmbedding } from "@/lib/openai";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
}

export async function POST(request: NextRequest) {
    try {
        // 1. Parse Request Body
        let body;
        try {
            body = await request.json();
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
        const contentSearch = body.contentSearch;
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
        if (contentSearch !== undefined && typeof contentSearch !== 'string') {
             return NextResponse.json({ error: "Invalid 'contentSearch' parameter. Must be a string." }, { status: 400 });
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

        // 3. Construct WHERE Clause
        const where: Prisma.MovieWhereInput = {};
        let vectorSearchIds: string[] | undefined = undefined;

        // --- Vector Search Logic (if contentSearch is provided) ---
        if (contentSearch && contentSearch.trim() !== '') {
            try {
                const queryEmbedding = await generateEmbedding(contentSearch.trim());

                // Fetch a larger set of candidates from vector search, as Prisma will apply further filters.
                // Adjust these numbers based on performance and desired recall.
                const vectorLimit = MAX_LIMIT * 5; // Fetch up to 500 candidates initially
                const vectorNumCandidates = vectorLimit * 10; // Consider 10x candidates for the search

                const vectorSearchResults = await performVectorSearch({
                    collection: "Movie",
                    index: "content-vector-index",
                    path: "contentEmbedding",
                    queryVector: queryEmbedding,
                    numCandidates: vectorNumCandidates,
                    limit: vectorLimit,
                    project: { _id: 1, score: { "$meta": "vectorSearchScore" } } 
                });

                vectorSearchIds = vectorSearchResults.map(result => result.id);

                // If vector search returns no IDs, and it was the primary search method, return empty
                if (vectorSearchIds.length === 0) {
                    return NextResponse.json({
                        data: [],
                        pagination: { currentPage: page, limit: limit, totalPages: 0, totalCount: 0 }
                    });
                }

                // Add vector search results to the main WHERE clause
                // This ensures only movies found by vector search are considered further
                where.id = { in: vectorSearchIds };

            } catch (error) {
                 console.error("Vector search or embedding generation failed:", error);
                 // Depending on requirements, you might want to return an error or fallback
                 // For now, returning an error:
                 return NextResponse.json(
                     { error: "Content search failed", details: error instanceof Error ? error.message : "Unknown error during vector search" },
                     { status: 500 }
                 );
            }
        }
        // --- End Vector Search Logic ---

        // --- Add other filters to WHERE clause (combined with vector search IDs if applicable) ---
        if (typeId) {
            where.typeId = typeId;
        }
        if (genreIds && genreIds.length > 0) {
            // Use hasEvery to ensure the movie has ALL specified genres
            where.genreIds = { hasEvery: genreIds };
        }
        if (countryId) {
            // Use has to ensure the movie has the specified country
            where.countryIds = { has: countryId };
        }
        if (startYear !== undefined || endYear !== undefined) {
            where.year = {};
            if (startYear !== undefined) {
                 where.year.gte = startYear;
            }
            if (endYear !== undefined) {
                 where.year.lte = endYear;
            }
        }
        // Add name filter (text search) - this will apply ON TOP of vector search results if contentSearch was used
        if (nameParam && typeof nameParam === 'string' && nameParam.trim() !== '') {
             // If 'id' filter is already set (from vector search), Prisma implicitly uses AND
             where.name = {
                 contains: nameParam.trim(),
                 mode: 'insensitive',
             };
        }
        // --- End Adding Other Filters ---

        // 4. Execute Database Query with Combined Filters
        // The 'where' object now includes vectorSearchIds (via where.id) if contentSearch was used,
        // AND all other specified filters.
        const [movies, totalCount] = await prisma.$transaction([
            prisma.movie.findMany({
                where,
                // Note: Sorting by vector score isn't directly feasible here when combining with Prisma filters.
                // The results are primarily filtered by vector search, then by other criteria,
                // and finally ordered by 'updatedAt'.
                // For true score-based ranking combined with filters, a direct Atlas Search aggregation pipeline is usually needed.
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: { // Select fields needed for the response
                    id: true,
                    name: true,
                    slug: true,
                    poster_url: true,
                    thumb_url: true,
                    year: true,
                    // Include genres if needed by MovieFrontEndResult
                    genres: { select: { name: true } },
                    updatedAt: true, // Keep if needed for sorting/display
                }
            }),
            prisma.movie.count({ where }) // Count uses the same combined where clause
        ]);

        // 5. Format Results
        const formattedMovies: MovieFrontEndResult[] = movies.map(movie => ({
            id: movie.id,
            name: movie.name,
            slug: movie.slug,
            poster_url: movie.poster_url,
            thumb_url: movie.thumb_url,
            year: movie.year,
            // Map genres if selected and needed
            genres: movie.genres?.map(g => g.name) ?? [],
            // score: vectorSearchResults?.find(v => v.id === movie.id)?.score // Optional: Add score if needed, requires fetching scores earlier
        }));

        const totalPages = Math.ceil(totalCount / limit);

        // 6. Return Response
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
        console.error("Filter Movies API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch filtered movies", details: errorMessage },
            { status: 500 }
        );
    }
}