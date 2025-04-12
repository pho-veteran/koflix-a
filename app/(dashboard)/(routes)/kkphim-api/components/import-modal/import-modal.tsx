"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileDown } from "lucide-react";
import { KKApiMovieBase, KKApiMovie } from "@/types/kkapi";
import { getMovieDetail } from "@/actions/get-movie-detail";
import axios from "axios";
import toast from "react-hot-toast";

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
    exists?: boolean;
  };
}

export const ImportModal = ({ isOpen, onClose, selectedMovies }: ImportModalProps) => {
  const [importStatus, setImportStatus] = useState<ImportStatus>({});
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isCheckingExistence, setIsCheckingExistence] = useState(false);
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
  const loadedCount = Object.values(importStatus).filter(status => !status.loading && !status.error && !status.exists).length;
  const errorCount = Object.values(importStatus).filter(status => status.error).length;
  const existingCount = Object.values(importStatus).filter(status => status.exists).length;
  const loadingCount = Object.values(importStatus).filter(status => status.loading).length;

  // Check if movies already exist in the database
  const checkExistingMovies = useCallback(async (movies: KKApiMovieBase[]) => {
    if (!movies.length) return {};
    
    setIsCheckingExistence(true);
    
    try {
      // Extract all slugs
      const slugs = movies.map(movie => movie.slug);
      
      // Call API to check which movies already exist
      const response = await axios.post('/api/movies/check-import', { slugs });
      const { existingSlugs } = response.data;
      
      // Create initial status with existing flag for already imported movies
      const initialStatus: ImportStatus = {};
      movies.forEach(movie => {
        const exists = existingSlugs.includes(movie.slug);
        initialStatus[movie._id] = {
          loading: !exists, // Only set to loading if it doesn't exist
          exists: exists
        };
      });
      
      return initialStatus;
    } catch (error) {
      console.error("Error checking existing movies:", error);
      toast.error("Failed to check for existing movies");
      
      // Return default status (all loading)
      return movies.reduce<ImportStatus>((acc, movie) => {
        acc[movie._id] = { loading: true };
        return acc;
      }, {});
    } finally {
      setIsCheckingExistence(false);
    }
  }, []);

  // Handle loading movies via API
  const fetchMovies = useCallback(async (movies: KKApiMovieBase[]) => {
    // Mark as fetching
    fetchingRef.current = true;
    
    // First, check which movies already exist
    const initialStatus = await checkExistingMovies(movies);
    setImportStatus(initialStatus);
    
    // Filter out movies that already exist
    const moviesToFetch = movies.filter(movie => 
      !initialStatus[movie._id]?.exists
    );
    
    // If all movies already exist, no need to fetch details
    if (moviesToFetch.length === 0) {
      return;
    }
    
    // Track which movies we're fetching
    pendingFetchesRef.current = new Set(moviesToFetch.map(m => m.slug));
    
    // Process movies with staggered timing
    let delay = 0;
    const delayIncrement = 100; // ms between requests
    
    for (const movie of moviesToFetch) {
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
  }, [checkExistingMovies]);

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
      .filter(([, status]) => status.detailedMovie && !status.loading && !status.exists && !status.error)
      .map(([, status]) => status.detailedMovie!)
      .filter(Boolean); // Additional safeguard to ensure no undefined values
    
    if (moviesToImport.length > 0) {
      // TODO: Implement actual import logic
      toast.success(`Importing ${moviesToImport.length} movies`);
      console.log("Movies to import:", moviesToImport);
      handleClose();
    } else {
      toast.error("No movies to import. Please try again.");
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
          existingCount={existingCount}
          isCheckingExistence={isCheckingExistence}
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
            disabled={isCheckingExistence || loadingCount > 0}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isCheckingExistence || loadingCount > 0 || loadedCount === 0}
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