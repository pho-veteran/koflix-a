"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { KKApiMovieBase, KKApiMovie } from "@/types/kkapi";
import { getMovieTypeIcon } from "../utils/movie-helpers";

interface ImportMovieCardProps {
  movie: KKApiMovieBase;
  status: {
    loading: boolean;
    detailedMovie?: KKApiMovie;
    error?: string;
  };
}

export function ImportMovieCard({ movie, status }: ImportMovieCardProps) {
  return (
    <Card className="p-0 overflow-hidden">
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
            {/* Title row with year badge */}
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm leading-tight line-clamp-2">
                {movie.name}
              </h4>
              {movie.year && (
                <Badge variant="outline" className="text-xs shrink-0 ml-auto">
                  {movie.year}
                </Badge>
              )}
            </div>

            {/* Original title */}
            {movie.origin_name && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {movie.origin_name}
              </p>
            )}
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
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}