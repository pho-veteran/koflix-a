import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyUserToken } from "@/lib/server-auth";
import { InteractionType } from "@prisma/client";

interface ViewPostBody {
    idToken?: string;
    movieId?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: ViewPostBody = await request.json();
        const { idToken, movieId } = body;

        // --- Validation ---
        if (!idToken) {
            return NextResponse.json(
                { error: "Authentication token required" },
                { status: 401 }
            );
        }
        if (!movieId || typeof movieId !== "string") {
            return NextResponse.json(
                { error: "Valid movieId is required" },
                { status: 400 }
            );
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

        // --- Check Movie Existence ---
        const movieExists = await prisma.movie.findUnique({
            where: { id: movieId },
            select: { id: true },
        });

        if (!movieExists) {
            return NextResponse.json(
                { error: `Movie with ID ${movieId} not found` },
                { status: 404 }
            );
        }

        // Increase movie view count
        await prisma.movie.update({
            where: { id: movieId },
            data: { view: { increment: 1 } },
        });

        // Create or Update UserInteraction (VIEW)
        try {
            const existingInteraction = await prisma.userInteraction.findFirst({
                where: {
                    userId: userId,
                    movieId: movieId,
                    interactionType: InteractionType.VIEW,
                },
            });

            if (existingInteraction) {
                await prisma.userInteraction.update({
                    where: { id: existingInteraction.id },
                    data: { timestamp: new Date() },
                });
            } else {
                await prisma.userInteraction.create({
                    data: {
                        userId: userId,
                        movieId: movieId,
                        interactionType: InteractionType.VIEW,
                        timestamp: new Date(),
                    },
                });
            }
        } catch (interactionError) {
            console.error(
                `Failed to log/update VIEW interaction for user ${userId} and movie ${movieId}:`,
                interactionError
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: `View count incremented and interaction logged for movie ${movieId}`,
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Increment View API Error:", error);
        if (error instanceof SyntaxError && error.message.includes("JSON")) {
            return NextResponse.json(
                { error: "Invalid JSON body" },
                { status: 400 }
            );
        }
        const errorMessage =
            error instanceof Error
                ? error.message
                : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to increment view count", details: errorMessage },
            { status: 500 }
        );
    }
}
