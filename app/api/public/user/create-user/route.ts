import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { uid, name, emailOrPhone } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user already exists in the database
    let user = await prisma.user.findUnique({
      where: {
        id: uid,
      },
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: {
          id: uid,
        },
        data: {
          name: name || user.name,
          emailOrPhone: emailOrPhone || user.emailOrPhone,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          id: uid,
          name: name || "App User",
          emailOrPhone: emailOrPhone || null,
          role: "CUSTOMER",
          avatarUrl: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        emailOrPhone: user.emailOrPhone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating/updating user from mobile app:", error);
    return NextResponse.json(
      {
        error: "Failed to create/update user",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}