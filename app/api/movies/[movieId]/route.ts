import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySessionCookie } from "@/lib/server-auth";

// Get a specific movie by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    // Verify authentication
    const { authenticated } = await verifySessionCookie();
    
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { movieId } = await params;
    
    if (!movieId) {
      return NextResponse.json({ error: "Movie ID is required" }, { status: 400 });
    }
    
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        type: true,
        genres: true,
        countries: true,
        episodes: {
          include: {
            servers: true
          }
        }
      }
    });
    
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }
    
    return NextResponse.json(movie);
  } catch (error) {
    console.error("[MOVIE_GET]", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the movie" },
      { status: 500 }
    );
  }
}

// Update a movie
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    // Verify authentication
    const { authenticated, userId } = await verifySessionCookie();
    
    if (!authenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { movieId } = await params;
    
    if (!movieId) {
      return NextResponse.json({ error: "Movie ID is required" }, { status: 400 });
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Check if movie exists
    const existingMovie = await prisma.movie.findUnique({
      where: { id: movieId }
    });
    
    if (!existingMovie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }
    
    // Update the movie
    const updatedMovie = await prisma.movie.update({
      where: { id: movieId },
      data: {
        name: body.name,
        slug: body.slug,
        origin_name: body.origin_name,
        typeId: body.typeId,
        genreIds: body.genreIds,
        countryIds: body.countryIds,
        year: body.year,
        time: body.time,
        poster_url: body.poster_url,
        thumb_url: body.thumb_url,
        trailer_url: body.trailer_url || null,
        quality: body.quality || null,
        lang: body.lang || null,
        sub_docquyen: body.sub_docquyen || false,
        episode_current: body.episode_current || null,
        episode_total: body.episode_total || null,
        status: body.status || null,
        is_copyright: body.is_copyright || false,
        chieurap: body.chieurap || false,
        actor: body.actor || [],
        director: body.director || [],
        content: body.content
      }
    });
    
    return NextResponse.json(updatedMovie);
  } catch (error) {
    console.error("[MOVIE_PATCH]", error);
    return NextResponse.json(
      { error: "An error occurred while updating the movie" },
      { status: 500 }
    );
  }
}

// Delete a movie
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    // Verify authentication
    const { authenticated, userId } = await verifySessionCookie();
    
    if (!authenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { movieId } = await params;
    
    if (!movieId) {
      return NextResponse.json({ error: "Movie ID is required" }, { status: 400 });
    }
    
    // Check if movie exists
    const existingMovie = await prisma.movie.findUnique({
      where: { id: movieId }
    });
    
    if (!existingMovie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }
    
    // Delete the movie (cascading delete will handle related entities)
    await prisma.movie.delete({
      where: { id: movieId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MOVIE_DELETE]", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the movie" },
      { status: 500 }
    );
  }
}