'use client';

import React, { useState, ChangeEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { UploadCloud, Video } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface VideoUploadProps {
  onUploadComplete: (url: string, key: string) => void;
  disabled?: boolean;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ onUploadComplete, disabled = false }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
          toast.error('Please select a valid video file.');
          event.target.value = ''; 
          setSelectedFile(null);
          return;
      }
      setSelectedFile(file);
      setUploadProgress(0);
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
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error) {
      console.error("Upload process error:", error);
      setIsUploading(false);
      setUploadProgress(0);
      toast.error('Upload failed. Please try again.');
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a valid video file.');
        return;
      }
      setSelectedFile(file);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  };

  return (
    <div className="space-y-4">
      <Input
        ref={fileInputRef}
        id="video-upload-input"
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={isUploading || disabled}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6
            flex flex-col items-center justify-center
            transition-colors duration-200 ease-in-out
            min-h-[140px] cursor-pointer
            ${dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={handleBrowseClick}
        >
          <UploadCloud 
            className="h-10 w-10 mb-3 text-gray-400 dark:text-gray-500" 
          />
          <p className="text-sm text-center font-medium text-gray-600 dark:text-gray-400">
            Drag and drop your video here, or click to browse
          </p>
          <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-1">
            Supported formats: MP4, WebM, MOV, AVI
          </p>
        </div>
      ) : (
        // Selected file display
        <div className="bg-gray-50 dark:bg-gray-800/60 border rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <Video className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            {!isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Change
              </Button>
            )}
          </div>
          
          {isUploading && (
            <div className="mt-3 space-y-2">
              <Progress value={uploadProgress} className="h-2 w-full" />
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || disabled}
          className="gap-2"
        >
          {isUploading ? (
            <>Uploading...</>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" />
              Upload Video
            </>
          )}
        </Button>
      </div>
    </div>
  );
};