"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MovieResult } from "@/types/backendType";
import { Star, Clock, Eye, Calendar, Heart } from "lucide-react";

interface MovieCardProps {
  movie: MovieResult;
  onClick: (movieId: string) => void;
  isSelectMode: boolean;
  isSelected: boolean;
  onSelect: (movieId: string, isSelected: boolean) => void;
}

export function MovieCard({
  movie,
  onClick,
  isSelectMode,
  isSelected,
  onSelect
}: MovieCardProps) {
  const [isHovering, setIsHovering] = useState(false);

  const formattedRating = movie.rating > 0
    ? movie.rating >= 10
      ? movie.rating.toFixed(0)
      : movie.rating.toFixed(1)
    : '-';

  const formattedViews = movie.views >= 1000
    ? (movie.views / 1000).toFixed(1) + 'k'
    : movie.views.toString();

  const handleCardClick = () => {
    onClick(movie.id);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(movie.id, !isSelected);
  };

  return (
    <Card 
      className={`relative group rounded-lg overflow-hidden transition-all p-0 py-0 gap-0 cursor-pointer
        ${isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-muted'}
      `}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleCardClick}
    >
      {/* Selection checkbox */}
      {isSelectMode && (
        <div 
          className={`absolute top-3 left-3 z-20 transition-all duration-200
            ${isHovering || isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          onClick={handleSelectClick}
        >
          <div className="rounded-md shadow-sm">
            <Checkbox 
              checked={isSelected}
              className="h-4 w-4 data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      )}
      
      <CardContent className="p-0">
        <div className="aspect-[2/3] relative overflow-hidden">
          {/* Poster image with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <Image
            src={movie.poster_url || '/placeholder.png'}
            alt={movie.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className={`object-cover transition-all duration-300 ${isSelected ? 'brightness-105 scale-105' : 'group-hover:scale-105'}`}
            priority={false}
          />

          {/* Top badges container */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 items-end">
            {movie.rating > 0 && (
              <Badge
                className="bg-black/75 backdrop-blur-sm text-white border-0 flex items-center gap-1 px-2 py-0.5 shadow-md"
              >
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {formattedRating}
              </Badge>
            )}

            {movie.year && (
              <Badge
                className="bg-black/75 backdrop-blur-sm text-white border-0 flex items-center gap-1 px-2 py-0.5 shadow-md"
              >
                <Calendar className="h-3 w-3" />
                {movie.year}
              </Badge>
            )}
          </div>

          {/* Bottom badges */}
          <div className="absolute bottom-0 inset-x-0 z-10 p-3 flex justify-between items-end">
            <div className="flex flex-col items-start gap-1.5">
              {movie.type && (
                <Badge
                  className="bg-primary/90 text-primary-foreground border-0 shadow-md"
                >
                  {movie.type}
                </Badge>
              )}

              {movie.episodeCurrent && (
                <Badge
                  className="bg-black/75 backdrop-blur-sm text-white border-0 flex items-center gap-1 shadow-md"
                >
                  <Clock className="h-3 w-3" />
                  EP {movie.episodeCurrent}
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-1.5 items-end">
              <Badge
                className="bg-black/75 backdrop-blur-sm text-white border-0 flex items-center gap-1 shadow-md"
              >
                <Eye className="h-3 w-3" />
                {formattedViews}
              </Badge>

              {movie.likes > 0 && (
                <Badge
                  className="bg-black/75 backdrop-blur-sm text-white border-0 flex items-center gap-1 shadow-md"
                >
                  <Heart className="h-3 w-3 fill-red-400 text-red-400" />
                  {movie.likes > 999 ? `${(movie.likes / 1000).toFixed(1)}k` : movie.likes}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className={`flex-col items-start p-3 pt-2 min-h-[60px] h-full ${isSelected ? 'bg-primary/5' : ''}`}>
        <h3 className={`font-medium text-sm leading-tight line-clamp-2 w-full mt-1 ${isSelected ? 'text-primary' : ''}`}>
          {movie.name}
        </h3>

        {movie.origin_name && movie.origin_name !== movie.name && (
          <p className="text-xs text-muted-foreground truncate w-full mt-1">
            {movie.origin_name}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}