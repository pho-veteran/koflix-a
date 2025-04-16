import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InteractionType, Prisma, UserInteraction } from "@prisma/client"; // Import UserInteraction type

interface InteractionRequestBody {
    userId?: string;
    movieId?: string;
    interactionType?: InteractionType;
    rating?: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: InteractionRequestBody = await request.json();
        const { userId, movieId, interactionType, rating } = body;

        // Validate required fields
        if (!userId || !movieId || !interactionType) {
            return NextResponse.json(
                { error: "Missing required fields: userId, movieId, interactionType" },
                { status: 400 }
            );
        }
        if (!Object.values(InteractionType).includes(interactionType)) {
             return NextResponse.json({ error: "Invalid interactionType" }, { status: 400 });
        }
        if (interactionType === InteractionType.RATE) {
            if (typeof rating !== 'number' || rating < 0 || rating > 5) {
                 return NextResponse.json({ error: "Invalid rating value for RATE interaction (must be number between 0-5)" }, { status: 400 });
            }
        } else if (rating !== undefined) {
            return NextResponse.json({ error: "Rating should only be provided for RATE interactionType" }, { status: 400 });
        }

        // Check if userId and movieId exist in the database
        const [userExists, movieExists] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
            prisma.movie.findUnique({ where: { id: movieId }, select: { id: true } })
        ]);
        if (!userExists) return NextResponse.json({ error: `User with ID ${userId} not found` }, { status: 404 });
        if (!movieExists) return NextResponse.json({ error: `Movie with ID ${movieId} not found` }, { status: 404 });


        // Perform the interaction in a transaction
        let finalInteractionResult: UserInteraction | null = null;

        await prisma.$transaction(async (tx) => {
            const movieUpdateData: Prisma.MovieUpdateInput = {};

            // --- Handle VIEW ---
            if (interactionType === InteractionType.VIEW) {
                finalInteractionResult = await tx.userInteraction.create({
                    data: { userId, movieId, interactionType }
                });
                movieUpdateData.view = { increment: 1 };
                // Removed assignment: interactionCreatedOrUpdated = true;
            }
            // --- Handle LIKE / DISLIKE ---
            else if (interactionType === InteractionType.LIKE || interactionType === InteractionType.DISLIKE) {
                const oppositeType = interactionType === InteractionType.LIKE ? InteractionType.DISLIKE : InteractionType.LIKE;

                const existingSameInteraction = await tx.userInteraction.findFirst({
                    where: { userId, movieId, interactionType }
                });

                if (existingSameInteraction) {
                    await tx.userInteraction.delete({ where: { id: existingSameInteraction.id } });
                    if (interactionType === InteractionType.LIKE) {
                        movieUpdateData.likeCount = { decrement: 1 };
                    } else {
                        movieUpdateData.dislikeCount = { decrement: 1 };
                    }
                } else {
                    const existingOppositeInteraction = await tx.userInteraction.findFirst({
                        where: { userId, movieId, interactionType: oppositeType }
                    });

                    if (existingOppositeInteraction) {
                        await tx.userInteraction.delete({ where: { id: existingOppositeInteraction.id } });
                        if (oppositeType === InteractionType.LIKE) {
                            movieUpdateData.likeCount = { decrement: 1 };
                        } else {
                            movieUpdateData.dislikeCount = { decrement: 1 };
                        }
                    }

                    finalInteractionResult = await tx.userInteraction.create({
                        data: { userId, movieId, interactionType }
                    });
                    if (interactionType === InteractionType.LIKE) {
                        movieUpdateData.likeCount = { increment: 1 };
                    } else {
                        movieUpdateData.dislikeCount = { increment: 1 };
                    }
                }
            }
            // --- Handle RATE ---
            else if (interactionType === InteractionType.RATE && rating !== undefined) {
                const existingRating = await tx.userInteraction.findFirst({
                    where: { userId, movieId, interactionType: InteractionType.RATE }
                });

                if (existingRating) {
                    finalInteractionResult = await tx.userInteraction.update({
                        where: { id: existingRating.id },
                        data: { rating: rating }
                    });
                } else {
                    finalInteractionResult = await tx.userInteraction.create({
                        data: { userId, movieId, interactionType, rating }
                    });
                }
                
                // Recalculate average rating AFTER the interaction is saved
                const newRatingAggregation = await tx.userInteraction.aggregate({
                    _avg: { rating: true },
                    _count: { rating: true },
                    where: { movieId: movieId, interactionType: InteractionType.RATE, rating: { not: null } },
                });

                const newAverageRating = newRatingAggregation._avg.rating ?? 0;
                const newRatingCount = newRatingAggregation._count.rating ?? 0;

                movieUpdateData.rating = parseFloat(newAverageRating.toFixed(2));
                movieUpdateData.ratingCount = newRatingCount;
            }

            // Apply movie count/rating updates if there are any
            if (Object.keys(movieUpdateData).length > 0) {
                await tx.movie.update({
                    where: { id: movieId },
                    data: movieUpdateData,
                });
            }

        });

        return NextResponse.json({ success: true, interaction: finalInteractionResult }, { status: 201 });

    } catch (error: unknown) {
        if (error instanceof SyntaxError && error.message.includes("JSON")) {
             return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }
        console.error("User Interaction API Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             if (error.code === 'P2002') {
                 return NextResponse.json({ error: "Interaction conflict, likely duplicate.", code: error.code }, { status: 409 });
             }
             return NextResponse.json({ error: "Database error", code: error.code }, { status: 500 });
        }
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to process interaction", details: errorMessage },
            { status: 500 }
        );
    }
}