"use client";

import { KKApiMovieBase } from "@/types/kkapi";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface MovieCardProps {
    movie: KKApiMovieBase;
    isSelected: boolean;
    onToggleSelection: (movieId: string) => void;
}

export const MovieCard = ({
    movie,
    isSelected,
    onToggleSelection
}: MovieCardProps) => {
    return (
        <Card
            className={`
                relative overflow-hidden cursor-pointer transition-all p-0 shadow-none
                ${isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : 'hover:border-primary/50 bg-card'}
            `}
            onClick={() => onToggleSelection(movie._id)}
        >
            <CardContent className="p-0">
                {/* Selection checkbox */}
                <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelection(movie._id)}
                        className="h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                </div>

                {/* Movie poster */}
                <div className="aspect-[2/3] relative">
                    <Image
                        src={movie.poster_url || '/placeholder.png'}
                        alt={movie.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className={`
                            object-cover transition-all duration-300
                            ${isSelected ? 'brightness-110' : 'hover:scale-105'}
                        `}
                        priority={false}
                        unoptimized={true}
                    />

                    {/* Top-right badges: Quality and Year */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        <Badge variant={isSelected ? "default" : "secondary"} className="bg-black/70 text-white border-0">
                            {movie.quality || 'HD'}
                        </Badge>
                        {movie.year && (
                            <Badge variant="outline" className="bg-black/70 text-white border-0">
                                {movie.year}
                            </Badge>
                        )}
                    </div>

                    {/* Bottom-right badges: Type and Episode */}
                    <div className="absolute bottom-2 left-2 flex flex-col items-start gap-1">
                        <Badge variant="outline" className="bg-black/70 text-white border-0">
                            {movie.type === 'series' ? 'Series' : 'Movie'}
                        </Badge>
                        {movie.type === 'series' && movie.episode_current && (
                            <Badge variant="outline" className="bg-black/70 text-white border-0">
                                EP {movie.episode_current}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
            
            <CardFooter className="flex-col px-3 min-h-[70px]">
                <h3 className="font-medium text-sm leading-tight line-clamp-2 w-full">
                    {movie.name}
                </h3>
                {movie.origin_name && (
                    <p className="text-xs text-muted-foreground truncate w-full mt-1">
                        {movie.origin_name}
                    </p>
                )}
            </CardFooter>
        </Card>
    );
};