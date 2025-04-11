"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  Check, 
  FileDown, 
  Search, 
  Film, 
  Layers, 
  LayoutGrid,
  BookOpen,
  SlidersHorizontal,
  Database
} from "lucide-react";
import { KKApiMovieBase } from "@/types/kkapi";
import { getMoviesList } from "@/actions/get-movies-list";
import { Input } from "@/components/ui/input";
import { MovieList } from "./movie-list";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface KKApiClientProps {
  initialMovies?: KKApiMovieBase[];
}

export const KKApiClient = ({ initialMovies = [] }: KKApiClientProps) => {
  const [mounted, setMounted] = useState(false);
  const [movies, setMovies] = useState<KKApiMovieBase[]>(initialMovies);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovies, setSelectedMovies] = useState<Set<string>>(new Set());
  const [pagesPerLoad, setPagesPerLoad] = useState(2); // Default: 2 pages (48 movies)
  
  // Track overall API stats
  const [apiTotalMovies, setApiTotalMovies] = useState<number>(0);

  // Add this to prevent initial double fetch
  const initialFetchDone = useRef(false);
  
  // Prevent automatic page recalculation
  const skipPageUpdate = useRef(false);

  // Use useCallback to memoize the fetchMovies function to avoid recreating it on every render
  const fetchMovies = useCallback(async (page: number = 1, skipPageCalculation: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    // Store the skip flag so it persists across the async operation
    skipPageUpdate.current = skipPageCalculation;

    try {
      // Create an array of promises for each page we need to fetch
      const pagePromises = Array.from({ length: pagesPerLoad }, (_, i) => 
        getMoviesList(page + i)
      );
      
      // Fetch all pages in parallel
      const results = await Promise.all(pagePromises);
      
      // Check for error in the first page (primary page)
      if (results[0].error) {
        setError(results[0].error);
      } else {
        // Combine movies from all pages
        const combinedMovies: KKApiMovieBase[] = [];
        
        // Add movies from each page if there was no error
        results.forEach(result => {
          if (!result.error) {
            combinedMovies.push(...result.movies);
          }
        });
        
        setMovies(combinedMovies);
        
        // Store the API's total movies count for stats
        setApiTotalMovies(results[0].pagination.totalItems);
        
        // Calculate new total pages (divide original by pagesPerLoad)
        const adjustedTotalPages = Math.ceil(results[0].pagination.totalPages / pagesPerLoad);
        setTotalPages(adjustedTotalPages);
        
        // Only update currentPage if not skipping the calculation
        if (!skipPageUpdate.current) {
          setCurrentPage(Math.ceil(page / pagesPerLoad));
        }
        
        // Clear selections when loading new pages
        setSelectedMovies(new Set());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch movies");
      console.error("Error fetching movies:", err);
    } finally {
      setIsLoading(false);
    }
  }, [pagesPerLoad]); // Only recreate if pagesPerLoad changes

  useEffect(() => {
    setMounted(true);
    if (!initialFetchDone.current) {
      fetchMovies(1);
      initialFetchDone.current = true;
    }
    // fetchMovies is memoized with useCallback, so it's safe to add as a dependency
  }, [fetchMovies]);

  useEffect(() => {
    if (mounted && initialFetchDone.current) {
      // Refetch when pagesPerLoad changes (will happen because fetchMovies depends on pagesPerLoad)
      fetchMovies((currentPage * pagesPerLoad) - (pagesPerLoad - 1), true);
    }
  }, [pagesPerLoad, mounted, currentPage, fetchMovies]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || isLoading) return;
    setCurrentPage(newPage);
    // Convert our display page to API page (multiply by pagesPerLoad to get the first page)
    fetchMovies((newPage * pagesPerLoad) - (pagesPerLoad - 1));
  };

  const handlePagesPerLoadChange = (value: number[]) => {
    setPagesPerLoad(value[0]);
  };

  // Filter movies by search query
  const filteredMovies = searchQuery.trim()
    ? movies.filter(movie =>
      movie.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (movie.origin_name && movie.origin_name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : movies;

  // Toggle movie selection
  const toggleMovieSelection = (movieId: string) => {
    const updatedSelection = new Set(selectedMovies);

    if (updatedSelection.has(movieId)) {
      updatedSelection.delete(movieId);
    } else {
      updatedSelection.add(movieId);
    }

    setSelectedMovies(updatedSelection);
  };

  // Select/deselect all visible movies
  const toggleSelectAll = () => {
    if (selectedMovies.size === filteredMovies.length) {
      // If all are selected, deselect all
      setSelectedMovies(new Set());
    } else {
      // Otherwise, select all visible movies
      const newSelection = new Set<string>();
      filteredMovies.forEach(movie => {
        newSelection.add(movie._id);
      });
      setSelectedMovies(newSelection);
    }
  };

  // Handle importing selected movies
  const handleImportSelected = () => {
    console.log("Importing selected movies:",
      movies.filter(movie => selectedMovies.has(movie._id))
    );
    // Placeholder for actual import functionality
    alert(`Selected ${selectedMovies.size} movies for import`);
  };

  if (!mounted) return null;

  // Count the number of series and single movies
  const seriesCount = filteredMovies.filter(m => m.type === 'series').length;
  const moviesCount = filteredMovies.filter(m => m.type === 'single').length;
  
  // Whether we're showing filtered results
  const isFiltered = searchQuery.trim().length > 0;
  
  // Shows number of filtered results out of total if filtering
  const statsPrefix = isFiltered ? `${filteredMovies.length} of ${movies.length}` : filteredMovies.length;

  return (
    <>
      {error && (
        <div className="text-red-500 bg-red-50 p-3 rounded-md border border-red-200 mb-4">
          Error: {error}
        </div>
      )}

      {/* Enhanced Stats and Action Bar */}
      <Card className="mb-6 shadow-sm bg-transparent p-0">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-0">
            {/* API Total Movies */}
            <div className="p-4 md:p-6 border-b md:border-b md:border-r flex items-center gap-3 lg:rounded-tl-lg lg:border-b-0">
              <div className="bg-indigo-500/10 p-2 rounded-full">
                <Database className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">API Total</p>
                <h3 className="text-xl font-semibold">{apiTotalMovies.toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">All available movies</p>
              </div>
            </div>
            
            {/* Total Movies (Currently Loaded) */}
            <div className="p-4 md:p-6 border-b md:border-b md:border-r flex items-center gap-3 lg:border-b-0">
              <div className="bg-primary/10 p-2 rounded-full">
                <Film className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loaded Movies</p>
                <h3 className="text-xl font-semibold">{statsPrefix}</h3>
                {isFiltered ? (
                  <p className="text-xs text-muted-foreground mt-0.5">Filtered results</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">Current page</p>
                )}
              </div>
            </div>
            
            {/* Series */}
            <div className="p-4 md:p-6 border-b lg:border-r flex items-center gap-3 lg:border-b-0 ">
              <div className="bg-blue-500/10 p-2 rounded-full">
                <Layers className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Series</p>
                <h3 className="text-xl font-semibold">{seriesCount}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Math.round((seriesCount / filteredMovies.length) * 100) || 0}% of loaded
                </p>
              </div>
            </div>
            
            {/* Movies */}
            <div className="p-4 md:p-6 flex items-center gap-3 border-b md:border-b-0 md:border-r">
              <div className="bg-amber-500/10 p-2 rounded-full">
                <BookOpen className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Movies</p>
                <h3 className="text-xl font-semibold">{moviesCount}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Math.round((moviesCount / filteredMovies.length) * 100) || 0}% of loaded
                </p>
              </div>
            </div>
            
            {/* Selected */}
            <div className="p-4 md:p-6 flex items-center gap-3 border-b md:border-b-0 md:border-r">
              <div className="bg-green-500/10 p-2 rounded-full">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Selected</p>
                <h3 className="text-xl font-semibold">
                  {selectedMovies.size}
                  {filteredMovies.length > 0 && (
                    <span className="text-sm text-muted-foreground ml-1">
                      of {filteredMovies.length}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filteredMovies.length > 0 
                    ? `${Math.round((selectedMovies.size / filteredMovies.length) * 100)}%`
                    : '0%'} selected
                </p>
              </div>
            </div>
            
            {/* Page */}
            <div className="p-4 md:p-6 flex items-center gap-3">
              <div className="bg-purple-500/10 p-2 rounded-full">
                <LayoutGrid className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Page</p>
                <h3 className="text-xl font-semibold">{currentPage}/{totalPages}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pagesPerLoad * 24} per page
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Bar */}
          <Separator />
          <div className="p-4 md:px-6 flex flex-wrap gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search by title in current page..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Settings Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {pagesPerLoad * 24} Movies/Page
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium leading-none">Display Settings</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pages-slider">Movies per page: {pagesPerLoad * 24}</Label>
                      <span className="text-xs text-muted-foreground">(API pages: {pagesPerLoad})</span>
                    </div>
                    <Slider
                      id="pages-slider"
                      min={1}
                      max={5}
                      step={1}
                      value={[pagesPerLoad]}
                      onValueChange={handlePagesPerLoadChange}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>24</span>
                      <span>48</span>
                      <span>72</span>
                      <span>96</span>
                      <span>120</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Each API page contains 24 movies. Increasing this value will load more movies at once.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={toggleSelectAll}
              >
                <Check className="h-4 w-4" />
                {selectedMovies.size === filteredMovies.length && filteredMovies.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              
              <Button
                size="sm"
                variant={selectedMovies.size > 0 ? "default" : "outline"}
                className="gap-1"
                disabled={selectedMovies.size === 0 || isLoading}
                onClick={handleImportSelected}
              >
                <FileDown className="h-4 w-4" />
                Import Selected
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                disabled={isLoading}
                onClick={() => fetchMovies((currentPage * pagesPerLoad) - (pagesPerLoad - 1))}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movie List Component with Pagination */}
      <MovieList
        movies={filteredMovies}
        isLoading={isLoading}
        selectedMovies={selectedMovies}
        onToggleSelection={toggleMovieSelection}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
};