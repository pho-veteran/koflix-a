"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { StatsPanel } from "./stats"; 
import { ActionBar } from "./actions";
import { MovieList } from "./movie-list";
import { MovieResult } from "@/types/backendType";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

type MovieFilters = {
    typeId: string | null;
    genreIds: string[];
    countryId: string | null;
    startYear: number | undefined;
    endYear: number | undefined;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
};

export const MoviesClient = () => {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [movies, setMovies] = useState<MovieResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    
    const [filters, setFilters] = useState<MovieFilters>({
        typeId: null,
        genreIds: [],
        countryId: null,
        startYear: undefined,
        endYear: undefined,
    });

    const [sortBy, setSortBy] = useState<string>('updatedAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedMovieIds, setSelectedMovieIds] = useState<Set<string>>(new Set());

    const [isDeleting, setIsDeleting] = useState(false);

    const initialFetchDone = useRef(false);

    // Memoize type counts to prevent recalculation on every render
    const movieTypeCounts = useMemo(() => {
        return movies.reduce((acc, movie) => {
            const typeSlug = movie.typeSlug?.toLowerCase();
            if (typeSlug === 'series') acc.series++;
            else if (typeSlug === 'single') acc.single++;
            else if (typeSlug === 'tvshows') acc.tvshows++;
            else if (typeSlug === 'hoathinh') acc.anime++;
            return acc;
        }, { series: 0, single: 0, tvshows: 0, anime: 0 });
    }, [movies]);

    // Memoize type-filtered counts
    const typeFilteredCounts = useMemo(() => {
        return {
            series: movies.filter(m => m.typeSlug === 'series').length,
            single: movies.filter(m => m.typeSlug === 'single').length,
            tvshows: movies.filter(m => m.typeSlug === 'tvshows').length,
            anime: movies.filter(m => m.typeSlug === 'hoathinh').length,
        };
    }, [movies]);

    const fetchMovies = useCallback(async (page: number = 1) => {
        setIsLoading(true);
        setError(null);

        try {
            const requestData = {
                page,
                limit: 48,
                typeId: filters.typeId,
                genreIds: filters.genreIds,
                countryId: filters.countryId,
                startYear: filters.startYear,
                endYear: filters.endYear,
                name: searchQuery.trim() || undefined,
                sortBy: sortBy,
                sortDirection: sortDirection,
            };

            const response = await axios.post('/api/movies/filter', requestData);

            if (response.data) {
                setMovies(response.data.data || []);
                setTotalPages(response.data.pagination.totalPages);
                setTotalCount(response.data.pagination.totalCount);
                setCurrentPage(response.data.pagination.currentPage);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch movies";
            setError(errorMessage);
            toast.error("Error loading movies: " + errorMessage);
            console.error("Error fetching movies:", err);
        } finally {
            setIsLoading(false);
        }
    }, [filters, searchQuery, sortBy, sortDirection]);

    // Handle initial load
    useEffect(() => {
        setMounted(true);
        fetchMovies(1);
        initialFetchDone.current = true;
    }, [fetchMovies]);

    // Apply filters
    useEffect(() => {
        if (mounted && initialFetchDone.current) {
            fetchMovies(1); // Reset to page 1 when filters change
        }
    }, [filters, sortBy, sortDirection, searchQuery, mounted, fetchMovies]);

    // Handle search submission
    const handleSearchSubmit = () => {
        setSearchQuery(searchInput);
    };

    // Handle search clear
    const handleSearchClear = () => {
        setSearchInput("");
        setSearchQuery("");
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || isLoading) return;
        fetchMovies(newPage);
    };

    // Handle filter changes
    const handleFilterChange = (newFilters: Partial<MovieFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    // Handler for sort change
    const handleSortChange = (newSortBy: string, newSortDirection: 'asc' | 'desc') => {
        setSortBy(newSortBy);
        setSortDirection(newSortDirection);
    };

    // Handle movie card click based on mode
    const handleMovieClick = (movieId: string) => {
        if (isSelectMode) {
            // In select mode, toggle selection
            handleSelectMovie(movieId, !selectedMovieIds.has(movieId));
        } else {
            // Not in select mode, navigate to edit page
            router.push(`/dashboard/movies/${movieId}`);
        }
    };

    // Handle movie selection
    const handleSelectMovie = (movieId: string, isSelected: boolean) => {
        setSelectedMovieIds(prev => {
            const newSelection = new Set(prev);
            if (isSelected) {
                newSelection.add(movieId);
            } else {
                newSelection.delete(movieId);
            }
            return newSelection;
        });
    };

    // Handle selecting movies by type
    const handleSelectByType = (type: string | null) => {
        // Enable select mode if selecting by type
        if (type !== null && !isSelectMode) {
            setIsSelectMode(true);
        }

        if (type === null) {
            // Clear selection
            setSelectedMovieIds(new Set());
        } else if (type === 'all') {
            // Select all visible movies
            const allIds = movies.map(movie => movie.id);
            setSelectedMovieIds(new Set(allIds));
        } else {
            // Select by movie type
            const filteredIds = movies
                .filter(movie => {
                    if (type === 'series') return movie.typeSlug === 'series';
                    if (type === 'single') return movie.typeSlug === 'single';
                    if (type === 'tvshows') return movie.typeSlug === 'tvshows';
                    if (type === 'anime' || type === 'hoathinh') return movie.typeSlug === 'hoathinh';
                    return false;
                })
                .map(movie => movie.id);

            setSelectedMovieIds(new Set(filteredIds));
        }
    };

    // Toggle select mode
    const toggleSelectMode = () => {
        const newMode = !isSelectMode;
        setIsSelectMode(newMode);

        // Clear selection when exiting select mode
        if (!newMode) {
            setSelectedMovieIds(new Set());
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedMovieIds.size === 0) return;

        const confirmed = window.confirm(`Are you sure you want to delete ${selectedMovieIds.size} movies? This action cannot be undone.`);
        if (!confirmed) return;

        setIsDeleting(true);

        try {
            const movieIdsArray = Array.from(selectedMovieIds);
            
            const response = await axios.post('/api/movies/bulk-delete', {
                movieIds: movieIdsArray
            });

            const result = response.data;
            
            toast.success(`Successfully deleted ${result.count} movies`);
            
            if (result.notFoundIds && result.notFoundIds.length > 0) {
                toast.error(`${result.notFoundIds.length} movies were not found and couldn't be deleted`);
            }
            
            // Refresh the movie list
            fetchMovies(1);
            
        } catch (error) {
            console.error('Error deleting movies:', error);
            
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 401) {
                    toast.error('Unauthorized. Please log in again.');
                } else if (error.response.status === 403) {
                    toast.error('You do not have permission to delete movies.');
                } else {
                    toast.error(`Error: ${error.response.data.error || 'Failed to delete movies'}`);
                }
            } else {
                toast.error('Failed to delete movies. Please try again.');
            }
        } finally {
            setIsDeleting(false);
            
            setSelectedMovieIds(new Set());
            setIsSelectMode(false);
        }
    };

    // Clear selection when movies change
    useEffect(() => {
        if (isSelectMode) {
            setSelectedMovieIds(new Set());
        }
    }, [movies.length, isSelectMode]);

    // Check if filters are applied - memoize this too
    const isFiltered = useMemo(() => {
        return Object.values(filters).some(v =>
            Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined
        ) || searchQuery.trim().length > 0;
    }, [filters, searchQuery]);

    if (!mounted) return null;

    // Create a memoized handleSearchInputChange to prevent unnecessary re-renders
    const handleSearchInputChangeOptimized = (value: string) => {
        setSearchInput(value);
    };

    return (
        <div className="space-y-4">
            {/* Error component */}
            {error && (
                <Card className="border-destructive/50 bg-destructive/10">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-destructive">
                            <span className="font-semibold">Error:</span> {error}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Selection bar */}
            {isSelectMode && (
                <div className="sticky top-2 z-30 bg-muted/80 border backdrop-blur-sm rounded-lg shadow-sm">
                    <div className="px-4 py-3 flex items-center justify-between">
                        <div className="font-medium">
                            {selectedMovieIds.size > 0 
                                ? `${selectedMovieIds.size} movies selected` 
                                : "Select movies to delete"}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={toggleSelectMode}
                            >
                                Cancel
                            </Button>
                            {selectedMovieIds.size > 0 && (
                                <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-1"
                                    disabled={isDeleting}
                                >
                                    <Trash size={16} />
                                    {isDeleting ? "Deleting..." : "Delete Selected"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <StatsPanel
                totalMovies={totalCount}
                filteredMovies={movies.length}
                currentPage={currentPage}
                totalPages={totalPages}
                movieTypeCounts={movieTypeCounts}
                isFiltered={isFiltered}
            />

            <ActionBar
                searchInput={searchInput}
                onSearchInputChange={handleSearchInputChangeOptimized}
                onSearchSubmit={handleSearchSubmit}
                onSearchClear={handleSearchClear}
                selectedTypeId={filters.typeId}
                selectedGenreIds={filters.genreIds}
                selectedCountryId={filters.countryId}
                yearRange={[filters.startYear, filters.endYear]}
                onFilterChange={handleFilterChange}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
                isLoading={isLoading}
                isSelectMode={isSelectMode}
                onToggleSelectMode={toggleSelectMode}
                onSelectByType={handleSelectByType}
                movieTypeCounts={typeFilteredCounts}
                filteredCount={movies.length}
            />

            <MovieList
                movies={movies}
                isLoading={isLoading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onMovieClick={handleMovieClick}
                isSelectMode={isSelectMode}
                selectedMovieIds={selectedMovieIds}
                onSelectMovie={handleSelectMovie}
            />
        </div>
    );
};