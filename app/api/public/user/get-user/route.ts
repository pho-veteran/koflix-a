import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Fetch user data from database
    const user = await prisma.user.findUnique({
      where: {
        id: uid,
      },
      select: {
        id: true,
        name: true,
        emailOrPhone: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ 
        user: null 
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user data from mobile app:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}