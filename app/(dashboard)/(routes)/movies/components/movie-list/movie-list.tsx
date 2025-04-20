"use client";

import { MovieResult } from "@/types/backendType";
import { MovieCard } from "./movie-card";
import { MoviesListSkeleton } from "./movies-list-skeleton";
import { MoviesListEmpty } from "./movies-list-empty";
import { MoviesListPagination } from "./movies-list-pagination";

interface MovieListProps {
  movies: MovieResult[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onMovieClick: (movieId: string) => void;
  isSelectMode: boolean;
  selectedMovieIds: Set<string>;
  onSelectMovie: (movieId: string, isSelected: boolean) => void;
}

export function MovieList({
  movies,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onMovieClick,
  isSelectMode,
  selectedMovieIds,
  onSelectMovie
}: MovieListProps) {
  return (
    <div className="space-y-4">
      {isLoading ? (
        <MoviesListSkeleton />
      ) : movies.length === 0 ? (
        <MoviesListEmpty />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {movies.map(movie => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={() => onMovieClick(movie.id)}
                isSelectMode={isSelectMode}
                isSelected={selectedMovieIds.has(movie.id)}
                onSelect={onSelectMovie}
              />
            ))}
          </div>
          
          {/* Pagination component */}
          {totalPages > 1 && (
            <MoviesListPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              isLoading={isLoading} 
            />
          )}
        </>
      )}
    </div>
  );
}