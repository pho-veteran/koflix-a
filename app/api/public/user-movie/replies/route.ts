import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyUserToken } from "@/lib/server-auth";
import { Prisma } from "@prisma/client";

const DEFAULT_REPLY_LIMIT = 10;
const MAX_REPLY_LIMIT = 30;

interface ReplyPostBody {
    idToken?: string;
    content?: string;
    commentId?: string;
}

/**
 * POST /api/public/user-movie/replies
 * Creates a new reply to a comment.
 */
export async function POST(request: NextRequest) {
    try {
        const body: ReplyPostBody = await request.json();
        const { idToken, content, commentId } = body;

        // --- Validation ---
        if (!idToken) {
            return NextResponse.json({ error: "Authentication token required" }, { status: 401 });
        }
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ error: "Reply content is required" }, { status: 400 });
        }
        if (content.length > 500) { // Example length limit for replies
            return NextResponse.json({ error: "Reply content exceeds maximum length (500 characters)" }, { status: 400 });
        }
        if (!commentId || typeof commentId !== 'string') {
            return NextResponse.json({ error: "Valid commentId is required" }, { status: 400 });
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

        // --- Check Existence (Comment) ---
        const commentExists = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { id: true }
        });
        if (!commentExists) {
            return NextResponse.json({ error: `Comment with ID ${commentId} not found` }, { status: 404 });
        }

        // --- Create Reply ---
        const newReply = await prisma.reply.create({
            data: {
                userId: userId,
                commentId: commentId,
                content: content.trim(),
            },
            include: {
                user: { // Include replier details
                    select: { id: true, name: true, avatarUrl: true }
                }
            }
        });

        return NextResponse.json({ success: true, reply: newReply }, { status: 201 });

    } catch (error: unknown) {
        console.error("Create Reply API Error:", error);
        if (error instanceof SyntaxError && error.message.includes("JSON")) {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to create reply", details: errorMessage },
            { status: 500 }
        );
    }
}

/**
 * GET /api/public/user-movie/replies
 * Fetches replies for a specific comment with pagination.
 * Query Params: commentId, page, limit
 */
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const commentId = url.searchParams.get('commentId');
        const pageParam = url.searchParams.get('page') ?? '1';
        const limitParam = url.searchParams.get('limit') ?? String(DEFAULT_REPLY_LIMIT);

        // --- Validation ---
        if (!commentId) {
            return NextResponse.json({ error: "commentId query parameter is required" }, { status: 400 });
        }

        let page = parseInt(pageParam, 10);
        let limit = parseInt(limitParam, 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = DEFAULT_REPLY_LIMIT;
        limit = Math.min(limit, MAX_REPLY_LIMIT);

        // --- Construct Query ---
        const where: Prisma.ReplyWhereInput = {
            commentId: commentId,
        };

        // --- Fetch Replies & Count ---
        const [replies, totalCount] = await prisma.$transaction([
            prisma.reply.findMany({
                where,
                include: {
                    user: { // Include replier details
                        select: { id: true, name: true, avatarUrl: true }
                    }
                },
                orderBy: { createdAt: 'asc' }, // Show oldest first for conversation flow
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.reply.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            data: replies,
            pagination: {
                currentPage: page,
                limit: limit,
                totalPages: totalPages,
                totalCount: totalCount,
            }
        });

    } catch (error: unknown) {
        console.error("Get Replies API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch replies", details: errorMessage },
            { status: 500 }
        );
    }
}