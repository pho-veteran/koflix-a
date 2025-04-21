"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Diff,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MovieResult } from "@/types/backendType";
import { KKApiMovie } from "@/types/kkapi";
import { DiffViewer } from "./diff-viewer"; 

interface UpdateMovieCardProps {
  movie: MovieResult;
  status: {
    loading: boolean;
    comparing: boolean;
    hasChanges: boolean;
    changedFields?: string[];
    detailedMovie?: KKApiMovie;
    error?: string;
    dbMovie?: MovieResult;
  };
}

export function UpdateMovieCard({ movie, status }: UpdateMovieCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Determine status badge content
  let statusBadge = null;

  if (status.error) {
    statusBadge = (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800 mb-1.5 text-[10px] px-1.5 py-0">
        <AlertCircle className="h-3 w-3 mr-0.5" />
        <span className="truncate">Error</span>
      </Badge>
    );
  } else if (status.comparing) {
    statusBadge = (
      <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800 mb-1.5 text-[10px] px-1.5 py-0">
        <Diff className="h-3 w-3 mr-0.5" />
        <span className="truncate">Comparing</span>
      </Badge>
    );
  } else if (status.loading) {
    statusBadge = (
      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800 mb-1.5 text-[10px] px-1.5 py-0">
        <Loader2 className="h-3 w-3 animate-spin mr-0.5" />
        <span className="truncate">Loading</span>
      </Badge>
    );
  } else if (status.hasChanges) {
    statusBadge = (
      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800 mb-1.5 text-[10px] px-1.5 py-0">
        <RefreshCw className="h-3 w-3 mr-0.5" />
        <span className="truncate">Update needed</span>
      </Badge>
    );
  } else {
    statusBadge = (
      <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-800 mb-1.5 text-[10px] px-1.5 py-0">
        <CheckCircle2 className="h-3 w-3 mr-0.5" />
        <span className="truncate">Up to date</span>
      </Badge>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`p-0 overflow-hidden relative gap-0 ${
        status.error ? 'border-red-200 dark:border-red-800/40' : 
        status.hasChanges ? 'border-green-200 dark:border-green-800/40' : 
        'border-gray-200 dark:border-gray-800/40'}`}
      >
        <div className="flex">
          {/* Poster thumbnail column - adjusted to match content height including padding */}
          <div className="relative shrink-0">
            <div className="relative h-[140px] w-[85px]">
              <Image
                src={movie.poster_url || '/placeholder.png'}
                alt={movie.name}
                fill
                className="object-cover"
                unoptimized={true}
              />
            </div>

            {/* Status indicator - transparent overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/70 to-transparent flex justify-center">
              {status.loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : status.comparing ? (
                <Diff className="h-4 w-4 text-purple-400" />
              ) : status.error ? (
                <div title={status.error}>
                  <AlertCircle className="h-4 w-4 text-red-400" />
                </div>
              ) : status.hasChanges ? (
                <RefreshCw className="h-4 w-4 text-green-400" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-gray-400" />
              )}
            </div>

            {/* Type indicator - top left badge */}
            <div className="absolute top-0 left-0 m-1">
              <div className="bg-black/70 rounded-sm flex items-center justify-center w-6 h-6 text-xs font-medium text-white">
                {movie.typeSlug === 'series' ? 'S' : 
                 movie.typeSlug === 'single' ? 'M' : 
                 movie.typeSlug === 'tvshows' ? 'TV' : 'A'}
              </div>
            </div>
          </div>

          {/* Content column */}
          <CardContent className="flex-1 py-3 px-4 flex flex-col justify-between overflow-hidden max-w-[calc(100%-85px)]">
            {/* Upper section */}
            <div className="w-full overflow-hidden">
              {/* Title row with stricter width control */}
              <div className="flex items-start gap-1.5 w-full">
                {/* Title and original title with max width */}
                <div className="space-y-1 min-w-0 flex-1 overflow-hidden max-w-[calc(100%-80px)]">
                  <h4 className="font-medium text-sm leading-tight line-clamp-2 break-words">
                    {movie.name}
                  </h4>
                  {/* Original title */}
                  {movie.origin_name && (
                    <p
                      className="text-xs text-muted-foreground mt-0.5 truncate max-w-[140px]"
                      title={movie.origin_name}
                    >
                      {movie.origin_name.length > 40
                        ? movie.origin_name.slice(0, 40) + '...'
                        : movie.origin_name}
                    </p>
                  )}
                </div>

                {/* Status and year badges column - improved layout */}
                <div className="flex flex-col items-end flex-shrink-0 min-w-[70px]">
                  {/* Status badge - ensure no overflow */}
                  <div className="flex justify-end overflow-hidden w-full">
                    {statusBadge}
                  </div>

                  {/* Year badge - below */}
                  {movie.year && (
                    <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0 whitespace-nowrap">
                      {movie.year}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom section */}
            <div className="mt-auto pt-2 w-full overflow-hidden">
              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5 overflow-hidden">
                  {movie.genres.slice(0, 2).map((genre, index) => (
                    <span key={index} className="rounded-full bg-muted/60 px-1.5 py-0 text-[9px] truncate max-w-[80px]" title={genre}>
                      {genre}
                    </span>
                  ))}
                  {movie.genres.length > 2 && (
                    <span className="rounded-full bg-muted/60 px-1.5 py-0 text-[9px] flex-shrink-0">
                      +{movie.genres.length - 2}
                    </span>
                  )}
                </div>
              )}

              {/* Technical specs and changed fields - improved spacing */}
              <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted-foreground overflow-hidden">
                {/* Left side - Episode count */}
                <div className="flex-shrink-0">
                  {movie.episodeCurrent && (
                    <span className="flex items-center">
                      <span className="inline-block w-1 h-1 rounded-full bg-blue-500 mr-1"></span>
                      {movie.typeSlug === 'series' ? 'EP' : ''} {movie.episodeCurrent}
                    </span>
                  )}
                </div>

                {/* Right side - Changes or error indicator */}
                <div className="flex-shrink-0">
                  {status.hasChanges && status.changedFields && (
                    <span className="text-green-500">
                      {status.changedFields.length} changes
                    </span>
                  )}

                  {status.error && (
                    <span className="text-red-500 truncate max-w-[100px]" title={status.error}>
                      Error
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Collapsible trigger - only if has changes or error */}
            {(status.hasChanges || status.error) && (
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 h-6 w-full text-xs"
                >
                  {isOpen ? (
                    <ChevronUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  )}
                  {isOpen ? "Hide details" : "Show details"}
                </Button>
              </CollapsibleTrigger>
            )}
          </CardContent>
        </div>

        {/* Diff view when expanded */}
        {(status.hasChanges || status.error) && (
          <CollapsibleContent>
            <div className="border-t px-4 py-3 text-sm">
              {status.error ? (
                <div className="text-red-500">
                  <h5 className="font-medium">Error</h5>
                  <p>{status.error}</p>
                </div>
              ) : status.hasChanges && status.changedFields && status.detailedMovie && (
                <DiffViewer 
                  changedFields={status.changedFields} 
                  apiMovie={status.detailedMovie} 
                  dbMovie={movie} 
                />
              )}
            </div>
          </CollapsibleContent>
        )}
      </Card>
    </Collapsible>
  );
}