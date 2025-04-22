import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySessionCookie } from "@/lib/server-auth";

// Create a new movie
export async function POST(req: Request) {
  try {
    // Verify authentication
    const { authenticated, userId } = await verifySessionCookie();
    
    if (!authenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Create the movie with all its relationships
    const movie = await prisma.movie.create({
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
        content: body.content,
        is_imported: false
      }
    });
    
    return NextResponse.json(movie);
  } catch (error) {
    console.error("[MOVIES_POST]", error);
    return NextResponse.json(
      { error: "An error occurred while creating the movie" },
      { status: 500 }
    );
  }
}

// Get all movies (with optional filtering)
export async function GET(req: Request) {
  try {
    // Verify authentication
    const { authenticated } = await verifySessionCookie();
    
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Get all movies with basic info
    const movies = await prisma.movie.findMany({
      skip,
      take: limit,
      include: {
        type: true,
        genres: true,
        countries: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    const totalCount = await prisma.movie.count();
    
    return NextResponse.json({
      movies,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("[MOVIES_GET]", error);
    return NextResponse.json(
      { error: "An error occurred while fetching movies" },
      { status: 500 }
    );
  }
}