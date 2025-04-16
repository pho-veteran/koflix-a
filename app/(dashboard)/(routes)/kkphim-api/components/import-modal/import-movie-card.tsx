"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";
import { KKApiMovieBase, KKApiMovie } from "@/types/kkapi";
import { getMovieTypeIcon } from "../utils/movie-helpers";

interface ImportMovieCardProps {
  movie: KKApiMovieBase;
  status: {
    loading: boolean;
    detailedMovie?: KKApiMovie;
    error?: string;
    exists?: boolean;
  };
}

export function ImportMovieCard({ movie, status }: ImportMovieCardProps) {
  // Determine status badge content
  let statusBadge = null;

  if (status.exists) {
    statusBadge = (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800 mb-1.5 text-[10px] px-1.5 py-0">
        <Info className="h-3 w-3 mr-0.5" />
        <span className="truncate">Exists</span>
      </Badge>
    );
  } else if (status.error) {
    statusBadge = (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800 mb-1.5 text-[10px] px-1.5 py-0">
        <AlertCircle className="h-3 w-3 mr-0.5" />
        <span className="truncate">Error</span>
      </Badge>
    );
  } else if (!status.loading && status.detailedMovie) {
    statusBadge = (
      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800 mb-1.5 text-[10px] px-1.5 py-0">
        <CheckCircle2 className="h-3 w-3 mr-0.5" />
        <span className="truncate">Ready</span>
      </Badge>
    );
  } else if (status.loading) {
    statusBadge = (
      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800 mb-1.5 text-[10px] px-1.5 py-0">
        <Loader2 className="h-3 w-3 animate-spin mr-0.5" />
        <span className="truncate">Loading</span>
      </Badge>
    );
  }

  return (
    <Card className={`p-0 overflow-hidden relative ${status.exists ? 'border-amber-200 dark:border-amber-800/40' : status.error ? 'border-red-200 dark:border-red-800/40' : (!status.loading && status.detailedMovie) ? 'border-green-200 dark:border-green-800/40' : ''}`}>
      <div className="flex">
        {/* Poster thumbnail column */}
        <div className="relative shrink-0">
          <div className="relative h-[120px] w-[85px]">
            <Image
              src={movie.thumb_url || movie.poster_url || '/placeholder.png'}
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
            ) : status.error ? (
              <div title={status.error}>
                <AlertCircle className="h-4 w-4 text-red-400" />
              </div>
            ) : status.exists ? (
              <Info className="h-4 w-4 text-amber-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            )}
          </div>

          {/* Type indicator - top left badge */}
          <div className="absolute top-0 left-0 m-1">
            <div className="bg-black/70 rounded-sm flex items-center justify-center w-6 h-6">
              {getMovieTypeIcon(movie.type)}
            </div>
          </div>
        </div>

        {/* Content column - strict max width to prevent overflow */}
        <CardContent className="flex-1 py-3 px-4 flex flex-col justify-between overflow-hidden max-w-[calc(100%-85px)]">
          {/* Upper section */}
          <div className="w-full overflow-hidden">
            {/* Title row with stricter width control */}
            <div className="flex items-start gap-1.5 w-full">
              {/* Title and original title with max width */}
              <div className="space-y-1 min-w-0 flex-1 overflow-hidden max-w-[calc(100%-80px)]">
                <h4 className="font-medium text-sm leading-tight line-clamp-2 break-all">
                  {movie.name}
                </h4>
                {/* Original title */}
                {movie.origin_name && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-60" title={movie.origin_name}>
                    {movie.origin_name}
                  </p>
                )}
              </div>

              {/* Status and year badges column - fixed width */}
              <div className="flex flex-col items-end flex-shrink-0 max-w-[70px]">
                {/* Status badge - shrink text further if needed */}
                <div className="max-w-full overflow-hidden">
                  {statusBadge}
                </div>

                {/* Year badge - below */}
                {movie.year && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 whitespace-nowrap">
                    {movie.year}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="mt-auto pt-2 w-full overflow-hidden">
            {/* Categories */}
            {movie.category && movie.category.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5 overflow-hidden">
                {movie.category.slice(0, 2).map(cat => (
                  <span key={cat.slug} className="rounded-full bg-muted/60 px-1.5 py-0 text-[9px] truncate max-w-[80px]" title={cat.name}>
                    {cat.name}
                  </span>
                ))}
                {movie.category.length > 2 && (
                  <span className="rounded-full bg-muted/60 px-1.5 py-0 text-[9px] flex-shrink-0">
                    +{movie.category.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Technical specs */}
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted-foreground overflow-hidden">
              {/* Episode count */}
              {movie.episode_current && (
                <span className="flex items-center flex-shrink-0">
                  <span className="inline-block w-1 h-1 rounded-full bg-blue-500 mr-1"></span>
                  {movie.type === 'series' ? 'EP' : ''} {movie.episode_current}
                </span>
              )}

              {/* Quality */}
              {movie.quality && (
                <span className="uppercase font-medium flex-shrink-0 max-w-[40px] truncate" title={movie.quality}>
                  {movie.quality}
                </span>
              )}

              {/* Language */}
              {movie.lang && (
                <span className="truncate max-w-[50px]" title={movie.lang}>{movie.lang}</span>
              )}

              {/* Display error message if present - use less space */}
              {status.error && (
                <span className="text-red-500 ml-auto truncate max-w-[80px] text-[9px]" title={status.error}>
                  {status.error}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}