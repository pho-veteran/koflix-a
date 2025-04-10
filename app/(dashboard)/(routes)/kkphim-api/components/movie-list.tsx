"use client";

import { KKApiMovieBase } from "@/types/kkapi";
import { MovieCard } from "./movie-card";
import { MoviesListSkeleton } from "./movies-list-skeleton";
import { MoviesListEmpty } from "./movies-list-empty";
import { MoviesListPagination } from "./movies-list-pagination";

interface MovieListProps {
    movies: KKApiMovieBase[];
    isLoading: boolean;
    selectedMovies: Set<string>;
    onToggleSelection: (movieId: string) => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const MovieList = ({
    movies,
    isLoading,
    selectedMovies,
    onToggleSelection,
    currentPage,
    totalPages,
    onPageChange
}: MovieListProps) => {
    return (
        <div className="mt-6 space-y-6">
            {/* Pagination at top */}
            <MoviesListPagination
                currentPage={currentPage}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={onPageChange}
            />

            {/* Content: Skeleton, Empty, or Movies */}
            {isLoading ? (
                <MoviesListSkeleton count={48} /> // Showing 48 for two pages combined
            ) : movies.length === 0 ? (
                <MoviesListEmpty />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {movies.map((movie) => (
                        <MovieCard
                            key={movie._id || `movie-${movie.name}`}
                            movie={movie}
                            isSelected={selectedMovies.has(movie._id)}
                            onToggleSelection={onToggleSelection}
                        />
                    ))}
                </div>
            )}

            {/* Pagination at bottom */}
            <MoviesListPagination
                currentPage={currentPage}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={onPageChange}
            />
        </div>
    );
};