'use client';

import React, { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface VideoUploadProps {
  onUploadComplete: (url: string, key: string) => void;
  disabled?: boolean;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ onUploadComplete, disabled = false }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic validation (optional: add more checks like file size)
      if (!file.type.startsWith('video/')) {
          toast.error('Please select a valid video file.');
          event.target.value = ''; // Clear the input
          setSelectedFile(null);
          return;
      }
      setSelectedFile(file);
      setUploadProgress(0); // Reset progress if a new file is selected
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a video file first.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Get presigned URL from our API
      const presignedUrlResponse = await axios.post('/api/uploads/presigned-url', {
        filename: selectedFile.name,
        contentType: selectedFile.type,
      });

      const { presignedUrl, key, finalUrl } = presignedUrlResponse.data;

      // 2. Upload the file directly to S3 using axios
      await axios.put(presignedUrl, selectedFile, {
        headers: {
          'Content-Type': selectedFile.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentComplete = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setUploadProgress(percentComplete);
          }
        },
      });

      // Handle success
      setIsUploading(false);
      toast.success('Video uploaded successfully!');
      onUploadComplete(finalUrl, key);
      setSelectedFile(null);

    } catch (error) {
      console.error("Upload process error:", error);
      setIsUploading(false);
      setUploadProgress(0); // Reset progress on error
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="video-upload-input" className="sr-only">Choose video</label>
        <Input
          id="video-upload-input"
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={isUploading || disabled}
          // Consider adding a ref to programmatically clear the input if needed after upload
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 dark:text-gray-400 dark:file:bg-violet-900 dark:file:text-violet-300 dark:hover:file:bg-violet-800"
        />
      </div>
      {selectedFile && !isUploading && (
        <p className="text-sm text-gray-600 dark:text-gray-400">Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
      )}
      {isUploading && (
        <div className="space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-150 ease-linear"
                style={{ width: `${uploadProgress}%` }}
            ></div>
            </div>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">{uploadProgress}%</p>
        </div>
      )}
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading || disabled}
      >
        {isUploading ? `Uploading... (${uploadProgress}%)` : 'Upload Video'}
      </Button>
    </div>
  );
};