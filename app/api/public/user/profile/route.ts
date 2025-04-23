import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebase-admin";
import prisma from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";

initAdmin();

export async function POST(request: NextRequest) {
  try {
    // Parse multipart/form-data
    const formData = await request.formData();
    const idToken = formData.get("idToken") as string;
    const name = formData.get("name") as string | undefined;
    const imageFile = formData.get("image");

    if (!idToken) {
      return NextResponse.json({ error: "ID token is required" }, { status: 400 });
    }

    // Verify the token and get user info
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    let avatarUrl = decodedToken.picture || null;

    // If image file is provided, upload to Cloudinary and use that as avatarUrl
    if (imageFile && typeof imageFile === "object" && "arrayBuffer" in imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const filename = (imageFile as File).name || `avatar-${uid}.jpg`;
      const uploadResult = await uploadToCloudinary(buffer, filename, "avatars");
      avatarUrl = uploadResult.url;
    }

    // Update or create user in DB
    let user = await prisma.user.findUnique({ where: { id: uid } });
    if (user) {
      user = await prisma.user.update({
        where: { id: uid },
        data: {
          name: name || user.name,
          avatarUrl: avatarUrl || user.avatarUrl,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          id: uid,
          name: name || decodedToken.name || "Anonymous User",
          emailOrPhone: decodedToken.email || decodedToken.phone_number || null,
          role: "CUSTOMER",
          avatarUrl: avatarUrl,
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
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      {
        error: "Failed to update user profile",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
