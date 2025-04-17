import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyUserToken } from "@/lib/server-auth";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function POST(request: NextRequest) {
  try {
    const { idToken, name, emailOrPhone } = await request.json();

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

    // Extract authenticated user ID
    const uid = authResult.userId;
    
    try {
      // First try to find the user
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
        // Create new user with error handling for potential race conditions
        try {
          user = await prisma.user.create({
            data: {
              id: uid,
              name: name || "App User",
              emailOrPhone: emailOrPhone || authResult.email || null,
              role: "CUSTOMER",
              avatarUrl: null,
            },
          });
        } catch (createError) {
          if (
            createError instanceof PrismaClientKnownRequestError &&
            createError.code === 'P2002'
          ) {
            // If there's a unique constraint error, try to fetch the user again
            // (another process might have created it in a race condition)
            user = await prisma.user.findUnique({
              where: { id: uid },
            });
            
            if (!user) {
              throw createError; // Re-throw if we still can't find the user
            }
          } else {
            throw createError; // Re-throw any other errors
          }
        }
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
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      return NextResponse.json(
        {
          error: "Database operation failed",
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 }
      );
    }
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