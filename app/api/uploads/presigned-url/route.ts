import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";
import { randomUUID } from "crypto";

// Ensure environment variables for the bucket name are set
const bucketName = process.env.AWS_S3_BUCKET_NAME;

if (!bucketName) {
  throw new Error("Missing AWS S3 bucket name in environment variables.");
}

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Filename and contentType are required" }, { status: 400 });
    }

    // Generate a unique key for the S3 object (e.g., using UUID)
    const uniqueKey = `${randomUUID()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueKey,
      ContentType: contentType,
      // You might want to add ACL or other parameters here depending on your needs
      // ACL: 'public-read', // Example: if you want the uploaded file to be publicly readable
    });

    // Generate the presigned URL for putting the object
    // Expires in 1 hour (3600 seconds) - adjust as needed
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Construct the final URL of the object after upload (optional, but useful)
    // Ensure your bucket policy and CORS configuration allow access if needed
    const finalUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueKey}`;

    console.log("Presigned URL generated:", presignedUrl);
    console.log("Final URL:", finalUrl);

    return NextResponse.json({ presignedUrl, key: uniqueKey, finalUrl });

  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}
