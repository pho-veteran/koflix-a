import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebase-admin";

import prisma from "@/lib/prisma";

// Initialize Firebase Admin
initAdmin();

export async function POST(request: NextRequest) {
    try {
        const { idToken, name, emailOrPhone } = await request.json();

        if (!idToken) {
            return NextResponse.json(
                { error: "ID token is required" },
                { status: 400 }
            );
        }

        // Verify the token and get user info
        const auth = getAuth();
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        console.log("Info", uid, name, emailOrPhone);
        console.log("Access")

        // Check if user already exists in our database
        let user = await prisma.user.findUnique({
            where: {
                id: uid,
            },
        });

        if (user) {
            // User exists, update if needed
            user = await prisma.user.update({
                where: {
                    id: uid,
                },
                data: {
                    name: name || user.name,
                    emailOrPhone: emailOrPhone || user.emailOrPhone,
                    // Update avatar URL if available in the token
                    avatarUrl: decodedToken.picture || user.avatarUrl,
                },
            });
        } else {
            // Create new user
            user = await prisma.user.create({
                data: {
                    id: uid,
                    name: name || decodedToken.name || "Anonymous User",
                    emailOrPhone:
                        emailOrPhone ||
                        decodedToken.email ||
                        decodedToken.phone_number ||
                        null,
                    role: "CUSTOMER", // Default role
                    avatarUrl: decodedToken.picture || null,
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
            },
        });
    } catch (error) {
        console.error("Error creating/updating user:", error);
        return NextResponse.json(
            {
                error: "Failed to create/update user",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
