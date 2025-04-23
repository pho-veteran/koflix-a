import axios from "axios";
import FormData from 'form-data';

/**
 * Uploads an image buffer to Cloudinary using the REST API and axios.
 * @param fileBuffer The image buffer.
 * @param filename The original filename.
 * @param folder The Cloudinary folder (default: 'avatars').
 * @returns The uploaded image's secure_url and public_id.
 */
export async function uploadToCloudinary(fileBuffer: Buffer, filename: string, folder = 'avatars') {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables are not set');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  // Dynamically import crypto for Node.js environment
  const crypto = await import('crypto');
  const signature = crypto.createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const formData = new FormData();
  // Pass the buffer directly to formData.append, along with the filename
  formData.append('file', fileBuffer, filename);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('folder', folder);
  formData.append('signature', signature);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      {
        // Get headers from the FormData instance for Node.js environment
        headers: formData.getHeaders(),
      }
    );

    if (!response.data || !response.data.secure_url) {
      console.error('Cloudinary upload failed:', response.data);
      throw new Error('Failed to upload image to Cloudinary');
    }

    return { url: response.data.secure_url, public_id: response.data.public_id };
  } catch (error) {
    console.error('Error uploading to Cloudinary:');
    if (axios.isAxiosError(error)) {
        throw new Error(`Cloudinary API error: ${error.response?.status} ${JSON.stringify(error.response?.data)}`);
    }
    throw error;
  }
}