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
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800 mb-1.5">
        <Info className="h-3 w-3" />
        Already exists
      </Badge>
    );
  } else if (status.error) {
    statusBadge = (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800 mb-1.5">
        <AlertCircle className="h-3 w-3" />
        Error
      </Badge>
    );
  } else if (!status.loading && status.detailedMovie) {
    statusBadge = (
      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800 mb-1.5">
        <CheckCircle2 className="h-3 w-3" />
        Ready
      </Badge>
    );
  } else if (status.loading) {
    statusBadge = (
      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800 mb-1.5">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading
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

        {/* Content column */}
        <CardContent className="flex-1 py-3 px-4 flex flex-col justify-between min-w-0">
          {/* Upper section */}
          <div>
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <h4 className="font-medium text-sm leading-tight line-clamp-2">
                  {movie.name}
                </h4>
                {/* Original title */}
                {movie.origin_name && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {movie.origin_name}
                  </p>
                )}
              </div>

              {/* Status and year badges column */}
              <div className="flex flex-col items-end ">
                {/* Status badge - above */}
                {statusBadge}

                {/* Year badge - below */}
                {movie.year && (
                  <Badge variant="outline" className="text-xs">
                    {movie.year}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="mt-auto pt-2">
            {/* Categories */}
            {movie.category && movie.category.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {movie.category.slice(0, 2).map(cat => (
                  <span key={cat.slug} className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px]">
                    {cat.name}
                  </span>
                ))}
                {movie.category.length > 2 && (
                  <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px]">
                    +{movie.category.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Technical specs */}
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {/* Episode count */}
              {movie.episode_current && (
                <span className="flex items-center">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></span>
                  {movie.type === 'series' ? 'EP' : ''} {movie.episode_current}
                </span>
              )}

              {/* Quality */}
              {movie.quality && (
                <span className="uppercase font-medium">
                  {movie.quality}
                </span>
              )}

              {/* Language */}
              {movie.lang && (
                <span>{movie.lang}</span>
              )}

              {/* Display error message if present */}
              {status.error && (
                <span className="text-red-500 ml-auto" title={status.error}>
                  {status.error.length > 30 ? `${status.error.substring(0, 30)}...` : status.error}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}