import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySessionCookie } from "@/lib/server-auth";

export async function POST(req: Request) {
  try {
    // First, verify auth and check for admin role
    const { authenticated, userId } = await verifySessionCookie();
    
    if (!authenticated || !userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await req.json();
    const { movieIds } = body;

    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return NextResponse.json(
        { error: "A valid array of movie IDs is required" },
        { status: 400 }
      );
    }

    const validIds = movieIds.every(id => typeof id === 'string');
    if (!validIds) {
      return NextResponse.json(
        { error: "All movie IDs must be strings" },
        { status: 400 }
      );
    }

    const existingMovies = await prisma.movie.findMany({
      where: {
        id: {
          in: movieIds
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    const existingIds = existingMovies.map(movie => movie.id);

    if (existingIds.length === 0) {
      return NextResponse.json(
        { error: "None of the provided movie IDs exist in the database" },
        { status: 404 }
      );
    }

    // Delete the movies
    // Note: Thanks to cascading delete defined in the schema,
    // related episodes, episode servers, comments, and other 
    // related entities will be automatically deleted
    const result = await prisma.movie.deleteMany({
      where: {
        id: {
          in: existingIds
        }
      }
    });

    // Return the result
    return NextResponse.json({
      message: "Movies deleted successfully",
      count: result.count,
      deletedIds: existingIds,
      notFoundIds: movieIds.filter(id => !existingIds.includes(id))
    });
  } catch (error) {
    console.error("[MOVIES_BULK_DELETE]", error);
    return NextResponse.json(
      { error: "An error occurred while deleting movies" },
      { status: 500 }
    );
  }
}