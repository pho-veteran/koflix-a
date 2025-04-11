"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileDown } from "lucide-react";
import { KKApiMovieBase, KKApiMovie } from "@/types/kkapi";
import { getMovieDetail } from "@/actions/get-movie-detail";

// Import sub-components
import { StatusSummary } from "./status-summary";
import { MovieTypeFilters } from "./movie-type-filters";
import { ImportMovieCard } from "./import-movie-card";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMovies: KKApiMovieBase[];
}

interface ImportStatus {
  [key: string]: {
    loading: boolean;
    detailedMovie?: KKApiMovie;
    error?: string;
  };
}

export const ImportModal = ({ isOpen, onClose, selectedMovies }: ImportModalProps) => {
  const [importStatus, setImportStatus] = useState<ImportStatus>({});
  const [activeTab, setActiveTab] = useState<string>("all");
  const fetchingRef = useRef<boolean>(false);
  
  // Use a ref to track pending requests via their slugs
  const pendingFetchesRef = useRef<Set<string>>(new Set());
  
  // Count movies by type
  const typeCounts = {
    all: selectedMovies.length,
    series: selectedMovies.filter(m => m.type === 'series').length,
    single: selectedMovies.filter(m => m.type === 'single').length,
    tvshows: selectedMovies.filter(m => m.type === 'tvshows').length,
    anime: selectedMovies.filter(m => m.type === 'hoathinh').length
  };

  // Filter movies by selected type
  const filteredMovies = activeTab === 'all'
    ? selectedMovies
    : selectedMovies.filter(movie => {
      if (activeTab === 'anime') return movie.type === 'hoathinh';
      return movie.type === activeTab;
    });

  // Status counts
  const loadedCount = Object.values(importStatus).filter(status => !status.loading && !status.error).length;
  const errorCount = Object.values(importStatus).filter(status => status.error).length;
  const loadingCount = Object.values(importStatus).filter(status => status.loading).length;

  // Handle loading movies via API
  const fetchMovies = useCallback(async (movies: KKApiMovieBase[]) => {
    // Mark as fetching
    fetchingRef.current = true;
    
    // Setup initial loading state
    const initialStatus = movies.reduce<ImportStatus>((acc, movie) => {
      acc[movie._id] = { loading: true };
      return acc;
    }, {});
    
    setImportStatus(initialStatus);
    
    // Track which movies we're fetching
    pendingFetchesRef.current = new Set(movies.map(m => m.slug));
    
    // Process movies with staggered timing
    let delay = 0;
    const delayIncrement = 100; // ms between requests
    
    for (const movie of movies) {
      // Skip if we've already started closing
      if (!fetchingRef.current) break;
      
      // Add delay between requests
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      delay = delayIncrement;
      
      // Skip if we're no longer fetching or this specific fetch was canceled
      if (!fetchingRef.current || !pendingFetchesRef.current.has(movie.slug)) continue;
      
      try {
        // Make the request
        const result = await getMovieDetail(movie.slug);
        
        // Skip updating state if we're no longer fetching
        if (!fetchingRef.current || !pendingFetchesRef.current.has(movie.slug)) continue;
        
        // Remove from pending set
        pendingFetchesRef.current.delete(movie.slug);
        
        // Update state with result
        setImportStatus(prev => ({
          ...prev,
          [movie._id]: {
            loading: false,
            detailedMovie: result.movie,
            // Only set error if it's actually present
            ...(result.error ? { error: result.error } : {})
          }
        }));
      } catch (error: unknown) {
        // Skip updating state if we're no longer fetching
        if (!fetchingRef.current || !pendingFetchesRef.current.has(movie.slug)) continue;
        
        // Remove from pending set
        pendingFetchesRef.current.delete(movie.slug);
        
        // Update state with error
        setImportStatus(prev => ({
          ...prev,
          [movie._id]: {
            loading: false,
            error: "Failed to fetch movie details"
          }
        }));
        console.error("Error fetching movie details:", error);
      }
    }
  }, []);

  // Start fetching when the modal opens
  useEffect(() => {
    if (isOpen && selectedMovies.length > 0 && !fetchingRef.current) {
      fetchMovies(selectedMovies);
    }
    
    // Cleanup function - abort any pending fetches
    return () => {
      fetchingRef.current = false;
      pendingFetchesRef.current.clear();
    };
  }, [isOpen, selectedMovies, fetchMovies]);

  // Reset state when modal closes
  const handleClose = () => {
    // Mark as not fetching to prevent any new state updates
    fetchingRef.current = false;
    pendingFetchesRef.current.clear();
    
    // Reset state
    setImportStatus({});
    setActiveTab("all");
    onClose();
  };

  const handleImport = () => {
    // Get all successfully loaded movies
    const moviesToImport = Object.entries(importStatus)
      .filter(([, status]) => status.detailedMovie && !status.loading)
      .map(([, status]) => status.detailedMovie!)
      .filter(Boolean); // Additional safeguard to ensure no undefined values
    console.log("Original status:", importStatus);
    console.log("Ready to import movies:", moviesToImport);
    
    if (moviesToImport.length > 0) {
      // TODO: Implement actual import logic
      alert(`Importing ${moviesToImport.length} movies`);
      handleClose();
    } else {
      alert("No movies to import. Please try again.");
    }
  };

  return (
    <Modal
      title="Import Selected Movies"
      description={`Prepare ${selectedMovies.length} movies for importing into database`}
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-full sm:max-w-[90%] md:max-w-[75%] lg:max-w-[65%] xl:max-w-[50%] 2xl:max-w-[900px]"
    >
      <div className="space-y-4">
        {/* Status summary */}
        <StatusSummary
          selectedCount={selectedMovies.length}
          loadingCount={loadingCount}
          loadedCount={loadedCount}
          errorCount={errorCount}
        />

        {/* Movie type filter tabs */}
        <MovieTypeFilters
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          typeCounts={typeCounts}
        >
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredMovies.map((movie) => (
                <ImportMovieCard
                  key={movie._id}
                  movie={movie}
                  status={importStatus[movie._id] || { loading: true }}
                />
              ))}
            </div>
          </ScrollArea>
        </MovieTypeFilters>

        <Separator className="my-2" />

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loadingCount > 0}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={loadingCount > 0 || loadedCount === 0}
            className="gap-1"
          >
            <FileDown className="h-4 w-4" />
            Import {loadedCount} Movies
          </Button>
        </div>
      </div>
    </Modal>
  );
};