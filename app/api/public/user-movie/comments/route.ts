import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyUserToken } from "@/lib/server-auth";
import { Prisma } from "@prisma/client";

const DEFAULT_COMMENT_LIMIT = 15;
const MAX_COMMENT_LIMIT = 50;

interface CommentPostBody {
    idToken?: string;
    content?: string;
    movieId?: string;
    episodeId?: string; 
}

/**
 * POST /api/public/user-movie/comment
 * Creates a new comment for a movie or episode.
 */
export async function POST(request: NextRequest) {
    try {
        const body: CommentPostBody = await request.json();
        const { idToken, content, movieId, episodeId } = body;

        // --- Validation ---
        if (!idToken) {
            return NextResponse.json({ error: "Authentication token required" }, { status: 401 });
        }
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
        }
        if (content.length > 1000) { // Example length limit
            return NextResponse.json({ error: "Comment content exceeds maximum length (1000 characters)" }, { status: 400 });
        }
        if (!movieId && !episodeId) {
            return NextResponse.json({ error: "Either movieId or episodeId is required" }, { status: 400 });
        }
        if (movieId && typeof movieId !== 'string') {
             return NextResponse.json({ error: "Invalid movieId format" }, { status: 400 });
        }
         if (episodeId && typeof episodeId !== 'string') {
             return NextResponse.json({ error: "Invalid episodeId format" }, { status: 400 });
        }

        // --- Authentication ---
        const authResult = await verifyUserToken(idToken);
        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json(
                { error: authResult.error || "Authentication failed" },
                { status: 401 }
            );
        }
        const userId = authResult.userId;

        // --- Check Existence (Movie/Episode) ---
        if (movieId) {
            const movieExists = await prisma.movie.findUnique({ where: { id: movieId }, select: { id: true } });
            if (!movieExists) {
                return NextResponse.json({ error: `Movie with ID ${movieId} not found` }, { status: 404 });
            }
        }
        if (episodeId) {
            const episodeExists = await prisma.episode.findUnique({ where: { id: episodeId }, select: { id: true, movieId: true } });
            if (!episodeExists) {
                return NextResponse.json({ error: `Episode with ID ${episodeId} not found` }, { status: 404 });
            }
            // Ensure episode belongs to the movie if both are provided
            if (movieId && episodeExists.movieId !== movieId) {
                 return NextResponse.json({ error: `Episode ${episodeId} does not belong to movie ${movieId}` }, { status: 400 });
            }
        }

        // --- Create Comment ---
        const newComment = await prisma.comment.create({
            data: {
                userId: userId,
                content: content.trim(),
                movieId: movieId || undefined, 
                episodeId: episodeId || undefined, 
            },
            include: { 
                user: {
                    select: { id: true, name: true, avatarUrl: true }
                }
            }
        });

        return NextResponse.json({ success: true, comment: newComment }, { status: 201 });

    } catch (error: unknown) {
        console.error("Create Comment API Error:", error);
        if (error instanceof SyntaxError && error.message.includes("JSON")) {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to create comment", details: errorMessage },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const movieId = url.searchParams.get('movieId');
        const episodeId = url.searchParams.get('episodeId');
        const pageParam = url.searchParams.get('page') ?? '1';
        const limitParam = url.searchParams.get('limit') ?? String(DEFAULT_COMMENT_LIMIT);

        // --- Validation ---
        if (!movieId && !episodeId) {
            return NextResponse.json({ error: "Either movieId or episodeId query parameter is required" }, { status: 400 });
        }

        let page = parseInt(pageParam, 10);
        let limit = parseInt(limitParam, 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = DEFAULT_COMMENT_LIMIT;
        limit = Math.min(limit, MAX_COMMENT_LIMIT);

        // --- Construct Query ---
        const where: Prisma.CommentWhereInput = {};

        if (episodeId) {
            where.episodeId = episodeId;
            if (movieId) {
                where.movieId = movieId;
            }
        } else if (movieId) {
            where.movieId = movieId;
            where.episodeId = undefined;
        }

        // --- Fetch Comments & Count ---
        const [comments, totalCount] = await prisma.$transaction([
            prisma.comment.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, avatarUrl: true }
                    },
                    _count: {
                        select: { replies: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.comment.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        const formattedComments = comments.map(comment => ({
            ...comment,
            replyCount: comment._count.replies,
            _count: undefined
        }));

        return NextResponse.json({
            data: formattedComments,
            pagination: {
                currentPage: page,
                limit: limit,
                totalPages: totalPages,
                totalCount: totalCount,
            }
        });

    } catch (error: unknown) {
        console.error("Get Comments API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch comments", details: errorMessage },
            { status: 500 }
        );
    }
}