'use client'

import Image from "next/image";
import { useEffect, useState, KeyboardEvent } from "react";
import { ImagePlus, Trash, Check, Link, X } from "lucide-react";
import { CldUploadWidget, CloudinaryUploadWidgetResults } from "next-cloudinary";

import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  value: string[];
  className?: string;
  imageClassName?: string;
  aspectRatio?: "square" | "portrait" | "landscape" | "auto";
  width?: string;
  height?: string;
  variant?: "default" | "compact" | "inline";
  maxCount?: number;
  buttonText?: string;
  uploadPreset?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  disabled,
  onChange,
  onRemove,
  value,
  className,
  imageClassName,
  aspectRatio = "square",
  width,
  height,
  variant = "default",
  maxCount = Infinity,
  buttonText = "Upload an Image",
  uploadPreset = "ic5k0ofb",
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState<string>("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (value.length > 0) {
      setTempUrl(value[0]);
    }
  }, [value]);

  const getAspectRatio = () => {
    switch (aspectRatio) {
      case "portrait": return "aspect-[2/3]";
      case "landscape": return "aspect-[16/9]";
      case "square": return "aspect-square";
      default: return ""; // Custom or auto
    }
  };

  // Determine if we should show the upload button (based on max images)
  const showUploadButton = value.length < maxCount;

  const onSuccess = (result: CloudinaryUploadWidgetResults) => {
    if (typeof result.info !== 'string' && result.info?.secure_url) {
      onChange(result.info.secure_url);
      setTempUrl(result.info.secure_url);
    }
  };

  const handleUrlClick = () => {
    setTempUrl(value[0] || "");
    setIsEditingUrl(true);
  };

  const confirmUrlChange = () => {
    if (tempUrl) {
      onChange(tempUrl);
    }
    setIsEditingUrl(false);
  };

  const cancelUrlChange = () => {
    setTempUrl(value[0] || "");
    setIsEditingUrl(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmUrlChange();
    } else if (e.key === 'Escape') {
      cancelUrlChange();
    }
  };

  if (!isMounted) {
    return null;
  }

  // Container styles based on dimensions and aspect ratio
  const containerStyles = cn(
    "relative w-full overflow-hidden rounded-md",
    getAspectRatio(),
    height ? "h-full" : "",
    className
  );

  // Size styles as inline style
  const sizeStyles = {
    width: width || "100%",
    height: height || "100%",
    minHeight: height ? undefined : aspectRatio === "auto" ? "120px" : undefined,
  };

  return (
    <div className={containerStyles} style={sizeStyles}>
      {value.length > 0 ? (
        // Image with overlay controls
        <>
          <Image
            fill
            className={cn("object-cover z-0", imageClassName)}
            alt="Image"
            src={value[0]}
            priority
            unoptimized
          />

          {/* Overlay with controls */}
          <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity z-10 flex flex-col justify-between p-3">
            {/* Top controls */}
            <div className="flex items-start justify-between w-full">
              {/* Upload button (if not at max) */}
              {showUploadButton && (
                <CldUploadWidget onSuccess={onSuccess} uploadPreset={uploadPreset}>
                  {({ open }) => (
                    <Button
                      type="button"
                      disabled={disabled}
                      variant="secondary"
                      size={variant === 'compact' ? 'sm' : 'default'}
                      onClick={() => open()}
                      className="bg-white/90 hover:bg-white/100"
                    >
                      <ImagePlus className={cn(
                        'mr-2',
                        variant === 'compact' ? 'w-3 h-3' : 'w-4 h-4'
                      )} />
                      {buttonText}
                    </Button>
                  )}
                </CldUploadWidget>
              )}

              {/* Remove button */}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => onRemove(value[0])}
                className="h-8 w-8"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>

            {/* URL display/editor at bottom */}
            <div className="w-full mt-auto">
              {isEditingUrl ? (
                <div className="flex items-center gap-2 bg-black/80 p-2 rounded-md">
                  <div className="flex-1 relative">
                    <Link className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-white/70" />
                    <Input
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="pl-8 pr-2 text-xs h-8 bg-b   lack/60 border-gray-600 focus:border-gray-400 text-white"
                      placeholder="Enter image URL..."
                      disabled={disabled}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={confirmUrlChange}
                    className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={cancelUrlChange}
                    className="h-8 w-8 p-0 bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="link"
                  className="p-2 h-auto w-full flex justify-start items-center text-xs text-white/90 hover:text-white bg-black/80 rounded-md truncate"
                  onClick={handleUrlClick}
                >
                  <Link className="w-3 h-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{value[0]}</span>
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        // Empty state with upload button
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 p-4">
          <div className="text-center">
            <CldUploadWidget onSuccess={onSuccess} uploadPreset={uploadPreset}>
              {({ open }) => (
                <Button
                  type="button"
                  disabled={disabled}
                  variant="secondary"
                  onClick={() => open()}
                  className={cn(
                    "w-full",
                    variant === 'compact' && 'h-8 text-xs px-3'
                  )}
                >
                  <ImagePlus className={cn(
                    'mr-2',
                    variant === 'compact' ? 'w-3 h-3' : 'w-4 h-4'
                  )} />
                  {buttonText}
                </Button>
              )}
            </CldUploadWidget>
          </div>

          {/* URL input for empty state */}
          <div className="mt-4 w-full">
            <div className="flex flex-col gap-2">
              <div className="text-xs text-muted-foreground text-center">
                Or enter an image URL directly:
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Link className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-8 text-xs"
                    placeholder="https://example.com/image.jpg"
                    disabled={disabled}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={confirmUrlChange}
                  disabled={!tempUrl || disabled}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
