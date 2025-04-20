import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { MovieResult } from "@/types/backendType";

// Configuration
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

// Valid sort fields and directions
const VALID_SORT_FIELDS = ['name', 'year', 'createdAt', 'updatedAt', 'view', 'rating'] as const;
type SortField = typeof VALID_SORT_FIELDS[number];
type SortDirection = 'asc' | 'desc';

// Request body type
interface FilterRequestBody {
    // Pagination
    page?: number;
    limit?: number;
    
    // Filters
    typeId?: string | null;
    genreIds?: string[];
    countryId?: string | null;
    startYear?: number;
    endYear?: number;
    name?: string;
    
    // Sorting
    sortBy?: SortField;
    sortDirection?: SortDirection;
    
    // Include flags
    includeStatistics?: boolean;
}

// Helper functions
function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim() !== '';
}

function isSortField(value: unknown): value is SortField {
    return typeof value === 'string' && VALID_SORT_FIELDS.includes(value as SortField);
}

function isSortDirection(value: unknown): value is SortDirection {
    return typeof value === 'string' && ['asc', 'desc'].includes(value as SortDirection);
}

export async function POST(request: NextRequest) {
    try {
        // 1. Parse and validate request body
        let body: FilterRequestBody;
        try {
            body = await request.json();
        } catch {
            // Removed the unused error variable
            body = {};
            console.log("Request body is empty or invalid JSON, proceeding with default filters");
        }

        // 2. Extract and validate filter parameters
        const {
            page: pageParam = 1,
            limit: limitParam = DEFAULT_LIMIT,
            typeId,
            genreIds,
            countryId,
            startYear,
            endYear,
            name: nameParam,
            sortBy = 'updatedAt',
            sortDirection = 'desc',
            includeStatistics = false
        } = body;

        // 3. Validate parameters
        if (typeId !== undefined && typeId !== null && typeof typeId !== 'string') {
            return NextResponse.json({ error: "Invalid 'typeId' parameter. Must be a string." }, { status: 400 });
        }
        
        if (genreIds !== undefined && !isStringArray(genreIds)) {
            return NextResponse.json({ error: "Invalid 'genreIds' parameter. Must be an array of strings." }, { status: 400 });
        }
        
        if (countryId !== undefined && countryId !== null && typeof countryId !== 'string') {
            return NextResponse.json({ error: "Invalid 'countryId' parameter. Must be a string." }, { status: 400 });
        }

        let validatedStartYear: number | undefined;
        let validatedEndYear: number | undefined;

        if (startYear !== undefined) {
            validatedStartYear = Number(startYear);
            if (isNaN(validatedStartYear)) {
                return NextResponse.json({ error: "Invalid 'startYear' parameter. Must be a number." }, { status: 400 });
            }
        }

        if (endYear !== undefined) {
            validatedEndYear = Number(endYear);
            if (isNaN(validatedEndYear)) {
                return NextResponse.json({ error: "Invalid 'endYear' parameter. Must be a number." }, { status: 400 });
            }
        }

        if (!isSortField(sortBy)) {
            return NextResponse.json({ 
                error: `Invalid 'sortBy' parameter. Must be one of: ${VALID_SORT_FIELDS.join(', ')}.` 
            }, { status: 400 });
        }

        if (!isSortDirection(sortDirection)) {
            return NextResponse.json({ 
                error: "Invalid 'sortDirection' parameter. Must be either 'asc' or 'desc'." 
            }, { status: 400 });
        }

        // 4. Pagination handling
        let page = Number(pageParam);
        let limit = Number(limitParam);
        
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
        limit = Math.min(limit, MAX_LIMIT);

        // 5. Construct WHERE clause
        const where: Prisma.MovieWhereInput = {};

        // Type filter
        if (isNonEmptyString(typeId)) {
            where.typeId = typeId;
        }

        // Genre filter - Use hasSome for a more intuitive OR condition
        if (genreIds && genreIds.length > 0) {
            where.genreIds = { hasSome: genreIds };
        }

        // Country filter
        if (isNonEmptyString(countryId)) {
            where.countryIds = { has: countryId };
        }

        // Year range filter
        if (validatedStartYear !== undefined || validatedEndYear !== undefined) {
            where.year = {};
            if (validatedStartYear !== undefined) {
                where.year.gte = validatedStartYear;
            }
            if (validatedEndYear !== undefined) {
                where.year.lte = validatedEndYear;
            }
        }

        // Name search filter
        if (isNonEmptyString(nameParam)) {
            where.name = {
                contains: nameParam.trim(),
                mode: 'insensitive',
            };
        }

        // 6. Construct ORDER BY clause with proper typing
        const orderBy: Prisma.MovieOrderByWithRelationInput = { 
            [sortBy]: sortDirection 
        };

        // 7. Execute Database Queries
        const startTime = performance.now();

        // Main movie query with optimized field selection
        const [movies, totalCount] = await prisma.$transaction([
            prisma.movie.findMany({
                where,
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    origin_name: true,
                    slug: true,
                    poster_url: true,
                    year: true,
                    view: true,
                    rating: true,
                    likeCount: true,
                    
                    // Add episode info for series
                    episode_current: true,
                    episode_total: true,
                    
                    // Improved genre selection with slugs
                    genres: { 
                        select: { 
                            name: true,
                            slug: true
                        } 
                    },
                    
                    // Get type info with slug for better mapping
                    type: { 
                        select: { 
                            name: true,
                            slug: true
                        } 
                    },
                    
                    updatedAt: true,
                    createdAt: true,
                }
            }),
            prisma.movie.count({ where })
        ]);

        // Improved type statistics for better mapping
        let statistics = null;
        if (includeStatistics) {
            const typeStats = await prisma.movieType.findMany({
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    _count: {
                        select: {
                            movies: {
                                where // Apply same filters
                            }
                        }
                    }
                }
            });
            
            statistics = {
                types: typeStats.map(type => ({
                    typeId: type.id,
                    name: type.name,
                    slug: type.slug,
                    count: type._count.movies
                }))
            };
        }

        // Format response with the new structure
        const formattedMovies: MovieResult[] = movies.map(movie => ({
            id: movie.id,
            name: movie.name,
            origin_name: movie.origin_name,
            slug: movie.slug,
            poster_url: movie.poster_url,
            year: movie.year,
            
            // Type information
            type: movie.type?.name,
            typeSlug: movie.type?.slug,
            
            // Categories with slugs
            genres: movie.genres.map(g => g.name),
            genreSlugs: movie.genres.map(g => g.slug),
            
            // Episode info - removed status
            episodeCurrent: movie.episode_current,
            episodeTotal: movie.episode_total,
            
            // Ratings and metrics
            rating: movie.rating,
            views: movie.view,
            likes: movie.likeCount,
            
            // Timestamps
            updatedAt: movie.updatedAt.toISOString(),
            createdAt: movie.createdAt.toISOString(),
        }));

        const totalPages = Math.ceil(totalCount / limit);
        const queryTime = Math.round(performance.now() - startTime);

        // 10. Return response
        return NextResponse.json({
            data: formattedMovies,
            pagination: {
                currentPage: page,
                limit: limit,
                totalPages: totalPages,
                totalCount: totalCount,
            },
            filters: {
                typeId,
                genreIds,
                countryId,
                startYear: validatedStartYear,
                endYear: validatedEndYear,
                name: nameParam,
            },
            sort: {
                field: sortBy,
                direction: sortDirection
            },
            metadata: {
                statistics,
                queryTime, // Performance metric in ms
            }
        });

    } catch (error: unknown) {
        console.error("Dashboard Movies Filter API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch filtered movies", details: errorMessage },
            { status: 500 }
        );
    }
}