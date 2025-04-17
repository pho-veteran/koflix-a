import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyUserToken } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "Authentication token required" },
        { status: 401 }
      );
    }

    // Verify the Firebase ID token to get the user UID
    const authResult = await verifyUserToken(idToken);

    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        { error: authResult.error || "Authentication failed" },
        { status: 401 }
      );
    }

    // Extract authenticated user ID from the verified token
    const uid = authResult.userId;

    // Fetch user data from database using the verified UID
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