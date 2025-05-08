"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { KKApiMovieBase } from "@/types/kkapi";
import { getMoviesList } from "@/actions/get-movies-list";
import { StatsPanel } from "./stats";
import { ActionBar } from "./action";
import { MovieList } from "./movie-list";
import { ImportModal } from "./import-modal";
import { useBreadcrumbs } from "@/providers/breadcrumb-provider";

export const KKApiClient = () => {
    const [mounted, setMounted] = useState(false);
    const { setBreadcrumbs } = useBreadcrumbs();
    const [movies, setMovies] = useState<KKApiMovieBase[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMovies, setSelectedMovies] = useState<Set<string>>(new Set());
    const [pagesPerLoad, setPagesPerLoad] = useState(2); // Default: 2 pages (48 movies)
    const [apiTotalMovies, setApiTotalMovies] = useState<number>(0);
    
    // Import modal state
    const [importModalOpen, setImportModalOpen] = useState(false);
    
    // Refs to prevent unnecessary fetches and automatic page recalculation
    const initialFetchDone = useRef(false);
    const skipPageUpdate = useRef(false);

    // Filter movies by search query
    const filteredMovies = searchQuery.trim()
        ? movies.filter(movie =>
            movie.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (movie.origin_name && movie.origin_name.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : movies;

    // Count movie types
    const movieTypeCounts = {
        series: filteredMovies.filter(m => m.type === 'series').length,
        single: filteredMovies.filter(m => m.type === 'single').length,
        tvshows: filteredMovies.filter(m => m.type === 'tvshows').length,
        anime: filteredMovies.filter(m => m.type === 'hoathinh').length
    };

    const fetchMovies = useCallback(async (page: number = 1, skipPageCalculation: boolean = false) => {
        setIsLoading(true);
        setError(null);
        skipPageUpdate.current = skipPageCalculation;

        try {
            const pagePromises = Array.from({ length: pagesPerLoad }, (_, i) =>
                getMoviesList(page + i)
            );

            const results = await Promise.all(pagePromises);

            if (results[0].error) {
                setError(results[0].error);
            } else {
                const combinedMovies: KKApiMovieBase[] = [];
                results.forEach(result => {
                    if (!result.error) {
                        combinedMovies.push(...result.movies);
                    }
                });

                setMovies(combinedMovies);
                setApiTotalMovies(results[0].pagination.totalItems);
                
                const adjustedTotalPages = Math.ceil(results[0].pagination.totalPages / pagesPerLoad);
                setTotalPages(adjustedTotalPages);
                
                if (!skipPageUpdate.current) {
                    setCurrentPage(Math.ceil(page / pagesPerLoad));
                }
                
                setSelectedMovies(new Set());
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch movies");
            console.error("Error fetching movies:", err);
        } finally {
            setIsLoading(false);
        }
    }, [pagesPerLoad]);

    // Handle initial load and page changes
    useEffect(() => {
        setMounted(true);
        if (!initialFetchDone.current) {
            fetchMovies(1);
            initialFetchDone.current = true;
        }
        // Set breadcrumbs
        setBreadcrumbs([
            { label: "Dashboard", href: "/dashboard" },
            { label: "KKPhim API" },
        ]);
    }, [fetchMovies, setBreadcrumbs]);

    useEffect(() => {
        if (mounted && initialFetchDone.current) {
            fetchMovies((currentPage * pagesPerLoad) - (pagesPerLoad - 1), true);
        }
    }, [pagesPerLoad, mounted, currentPage, fetchMovies]);

    // UI event handlers
    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || isLoading) return;
        setCurrentPage(newPage);
        fetchMovies((newPage * pagesPerLoad) - (pagesPerLoad - 1));
    };

    const handlePagesPerLoadChange = (value: number[]) => {
        setPagesPerLoad(value[0]);
    };

    const toggleMovieSelection = (movieId: string) => {
        const updatedSelection = new Set(selectedMovies);
        if (updatedSelection.has(movieId)) {
            updatedSelection.delete(movieId);
        } else {
            updatedSelection.add(movieId);
        }
        setSelectedMovies(updatedSelection);
    };

    const selectByType = (type: string | null) => {
        const newSelection = new Set<string>(selectedMovies);
        
        if (type === null) {
            newSelection.clear();
        } else if (type === 'all') {
            filteredMovies.forEach(movie => {
                newSelection.add(movie._id);
            });
        } else {
            filteredMovies
                .filter(movie => movie.type === type)
                .forEach(movie => {
                    newSelection.add(movie._id);
                });
        }
        
        setSelectedMovies(newSelection);
    };

    const handleImportSelected = () => {
        setImportModalOpen(true);
    };

    const handleRefresh = () => {
        fetchMovies((currentPage * pagesPerLoad) - (pagesPerLoad - 1));
    };

    // Get the movies data for the selected IDs
    const selectedMoviesData = movies.filter(movie => selectedMovies.has(movie._id));

    if (!mounted) return null;

    return (
        <>
            {error && (
                <div className="text-red-500 bg-red-50 p-3 rounded-md border border-red-200 mb-4">
                    Error: {error}
                </div>
            )}

            <StatsPanel 
                apiTotalMovies={apiTotalMovies}
                totalMovies={movies.length}
                filteredMovies={filteredMovies.length}
                currentPage={currentPage}
                totalPages={totalPages}
                pagesPerLoad={pagesPerLoad}
                movieTypeCounts={movieTypeCounts}
                isFiltered={searchQuery.trim().length > 0}
            />

            <ActionBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                pagesPerLoad={pagesPerLoad}
                onPagesPerLoadChange={handlePagesPerLoadChange}
                selectedCount={selectedMovies.size}
                movieTypeCounts={movieTypeCounts}
                filteredCount={filteredMovies.length}
                onSelectByType={selectByType}
                onImportSelected={handleImportSelected}
                onRefresh={handleRefresh}
                isLoading={isLoading}
            />

            <MovieList
                movies={filteredMovies}
                isLoading={isLoading}
                selectedMovies={selectedMovies}
                onToggleSelection={toggleMovieSelection}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

            {/* Import Modal */}
            <ImportModal 
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                selectedMovies={selectedMoviesData}
            />
        </>
    );
};