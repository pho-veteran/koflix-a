import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slugs } = body;

    if (!slugs || !Array.isArray(slugs)) {
      return new NextResponse("Invalid slugs array", { status: 400 });
    }

    // Find existing movies with matching slugs
    const existingMovies = await prisma.movie.findMany({
      where: {
        slug: {
          in: slugs
        }
      },
      select: {
        slug: true
      }
    });

    // Create a map of existing slugs for quick lookup
    const existingSlugs = existingMovies.map(movie => movie.slug);

    return NextResponse.json({ existingSlugs });
  } catch (error) {
    console.log("[MOVIES_CHECK_IMPORT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}