import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { movieId: string } }
) {
  try {
    const { movieId } = await params;

    if (!movieId) {
      return NextResponse.json({ error: "Movie ID is required" }, { status: 400 });
    }

    // Check if movie exists
    const movieExists = await prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true }
    });

    if (!movieExists) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    // Get all episodes with their servers for the movie
    const episodes = await prisma.episode.findMany({
      where: { movieId },
      include: {
        servers: true
      },
      orderBy: {
        createdAt: 'asc' // Default order by creation date
      }
    });

    return NextResponse.json({ episodes });
  } catch (error) {
    console.error("[EPISODES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}