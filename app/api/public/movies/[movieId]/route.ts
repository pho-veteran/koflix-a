import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma, InteractionType } from "@prisma/client";

interface UserInteractionData {
    isLiked: boolean;
    isDisliked: boolean;
    rating: number | null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ movieId: string }> }
) {
    try {
        const { movieId } = await params;

        const userId = request.nextUrl.searchParams.get("userId");

        if (!movieId) {
            return NextResponse.json({ error: "Movie ID or Slug is required" }, { status: 400 });
        }

        const movie = await prisma.movie.findFirst({
            where: {
                 OR: [
                    { id: movieId },
                    { slug: movieId }
                ]
            },
            include: {
                type: { select: { id: true, name: true, slug: true } },
                genres: { select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } },
                countries: { select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } },
                episodes: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true, name: true, slug: true,
                        servers: {
                            select: {
                                id: true, server_name: true, filename: true,
                                link_embed: true, link_m3u8: true, link_mp4: true,
                                createdAt: true, updatedAt: true,
                            }
                        }
                    }
                }
            }
        });

        if (!movie) {
            return NextResponse.json({ error: "Movie not found" }, { status: 404 });
        }

        // Initialize userInteractionData as null
        let userInteractionData: UserInteractionData | null = null;

        // Only fetch user interactions if userId is provided
        if (userId) {
            const interactions = await prisma.userInteraction.findMany({
                where: {
                    userId: userId,
                    movieId: movie.id,
                    interactionType: { in: [InteractionType.LIKE, InteractionType.DISLIKE, InteractionType.RATE] }
                },
                select: {
                    interactionType: true,
                    rating: true
                }
            });

            userInteractionData = {
                isLiked: interactions.some(i => i.interactionType === InteractionType.LIKE),
                isDisliked: interactions.some(i => i.interactionType === InteractionType.DISLIKE),
                rating: interactions.find(i => i.interactionType === InteractionType.RATE)?.rating ?? null
            };
        }

        const responseData = {
            id: movie.id,
            name: movie.name,
            slug: movie.slug,
            origin_name: movie.origin_name,
            type: movie.type.name,
            poster_url: movie.poster_url,
            thumb_url: movie.thumb_url,
            sub_docquyen: movie.sub_docquyen,
            episode_current: movie.episode_current ?? "",
            time: movie.time,
            quality: movie.quality ?? "",
            lang: movie.lang ?? "",
            year: movie.year,
            tmdb: {
                id: movie.tmdb_id ?? "", type: movie.tmdb_type ?? "", season: movie.tmdb_season ?? 0,
                vote_average: movie.vote_average ?? 0, vote_count: movie.vote_count ?? 0,
            },
            imdb: { id: movie.imdb_id ?? "" },
            content: movie.content,
            status: movie.status ?? "",
            is_copyright: movie.is_copyright,
            chieurap: movie.chieurap,
            trailer_url: movie.trailer_url,
            episode_total: movie.episode_total ?? "",
            notify: movie.notify ?? "",
            showtimes: movie.showtimes ?? "",
            view: movie.view,
            rating: movie.rating,
            ratingCount: movie.ratingCount ?? 0,
            likeCount: movie.likeCount,
            dislikeCount: movie.dislikeCount,
            category: [{ id: movie.type.id, name: movie.type.name, slug: movie.type.slug }],
            country: movie.countries.map(c => ({ id: c.id, name: c.name, slug: c.slug })),
            actor: movie.actor,
            director: movie.director,
            genres: movie.genres.map(g => g.name),
            episodes: movie.episodes.map(ep => ({
                id: ep.id, name: ep.name, slug: ep.slug,
                servers: ep.servers.map(s => ({
                    id: s.id, server_name: s.server_name, filename: s.filename ?? "",
                    link_embed: s.link_embed ?? "", link_m3u8: s.link_m3u8 ?? "", link_mp4: s.link_mp4 ?? "",
                    createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString(),
                }))
            })),
            createdAt: movie.createdAt.toISOString(),
            updatedAt: movie.updatedAt.toISOString(),
            userInteraction: userInteractionData
        };

        return NextResponse.json({ data: responseData });

    } catch (error: unknown) {
        console.error("Get Movie Detail API Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             return NextResponse.json({ error: "Database query error", code: error.code }, { status: 500 });
        }
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: "Failed to fetch movie details", details: errorMessage },
            { status: 500 }
        );
    }
}