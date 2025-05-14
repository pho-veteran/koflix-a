import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const { movieId } = await params;

    if (!movieId) {
      return NextResponse.json({ error: "Movie ID is required" }, { status: 400 });
    }

    const movieExists = await prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true }
    });

    if (!movieExists) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const episodes = await prisma.episode.findMany({
      where: { movieId },
      include: {
        servers: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ episodes });
  } catch (error) {
    console.error("[EPISODES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Create new episode
export async function POST(
  req: Request,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
      const body = await req.json();
      const { movieId } = await params;

      // Validate request
      const { name, slug } = body;

      if (!name || !slug) {
          return new NextResponse("Name and slug are required", {
              status: 400,
          });
      }

      // Check that the movie exists
      const movie = await prisma.movie.findUnique({
          where: { id: movieId },
          select: { id: true }
      });

      if (!movie) {
          return new NextResponse("Movie not found", { status: 404 });
      }

      const existingEpisode = await prisma.episode.findFirst({
          where: {
              movieId,
              slug,
          },
      });

      if (existingEpisode) {
          return new NextResponse("An episode with this slug already exists for this movie", { 
              status: 400 
          });
      }

      const episode = await prisma.episode.create({
          data: {
              name,
              slug,
              movieId,
          },
      });

      return NextResponse.json(episode);
  } catch (error) {
      console.error("[EPISODE_POST]", error);
      return new NextResponse("Internal error", { status: 500 });
  }
}