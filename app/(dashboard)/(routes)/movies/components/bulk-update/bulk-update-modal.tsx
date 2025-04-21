"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCw } from "lucide-react";
import { MovieResult } from "@/types/backendType";
import { KKApiMovie, KKApiEpisode } from "@/types/kkapi";
import { getMovieDetail } from "@/actions/get-movie-detail";
import axios from "axios";
import toast from "react-hot-toast";
import { formatImportMoviesArray } from "@/types/typeUtils";

import { StatusSummary } from "./status-summary"; 
import { BulkUpdateTypeFilters } from "./bulk-update-type-filters";
import { UpdateMovieCard } from "./update-movie-card";

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMovies: MovieResult[];
  onMoviesUpdated?: () => void;
}

interface UpdateStatus {
  [key: string]: {
    loading: boolean;
    comparing: boolean;
    hasChanges: boolean;
    changedFields?: string[];
    detailedMovie?: KKApiMovie;
    episodes?: KKApiEpisode[];
    error?: string;
    dbMovie?: MovieResult;
  };
}

export const BulkUpdateModal = ({ isOpen, onClose, selectedMovies, onMoviesUpdated }: BulkUpdateModalProps) => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({});
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchingRef = useRef<boolean>(false);
  const pendingFetchesRef = useRef<Set<string>>(new Set());
  
  // Exclude single-type movies as they don't have episodes to update
  const excludedCompletedMoviesCount = selectedMovies.filter(movie =>
    movie.typeSlug !== 'single' &&
    typeof movie.episodeCurrent === 'string' &&
    movie.episodeCurrent.toLowerCase().includes('hoàn tất')
  ).length;

  const processableMovies = selectedMovies.filter(movie => {
    // Exclude single type
    if (movie.typeSlug === 'single') return false;
    // Exclude series with 'hoàn tất' in episodeCurrent (case-insensitive)
    if (
      typeof movie.episodeCurrent === 'string' &&
      movie.episodeCurrent.toLowerCase().includes('hoàn tất')
    ) {
      return false;
    }
    return true;
  });
  const excludedSingleMoviesCount = selectedMovies.length - processableMovies.length - excludedCompletedMoviesCount;
  
  // Movie type counts for the tabs - exclude single movies
  const typeCounts = {
    all: processableMovies.length,
    series: processableMovies.filter(m => m.typeSlug === 'series').length,
    tvshows: processableMovies.filter(m => m.typeSlug === 'tvshows').length,
    anime: processableMovies.filter(m => m.typeSlug === 'hoathinh').length
  };

  // Filter movies based on selected tab - only include processable movies
  const filteredMovies = activeTab === 'all'
    ? processableMovies
    : processableMovies.filter(movie => {
        if (activeTab === 'anime') return movie.typeSlug === 'hoathinh';
        return movie.typeSlug === activeTab;
      });

  // Status counts for the summary - filter to current tab 
  const getStatusCounts = () => {
    // Get IDs of movies that match the current filter
    const filteredMovieIds = filteredMovies.map(movie => movie.id);
    
    // Only count statuses for movies in the current filter
    const filteredStatuses = Object.entries(updateStatus)
      .filter(([id]) => filteredMovieIds.includes(id));
    
    return {
      loadingCount: filteredStatuses.filter(([, status]) => status.loading).length,
      comparingCount: filteredStatuses.filter(([, status]) => status.comparing).length,
      changedCount: filteredStatuses.filter(([, status]) => status.hasChanges).length,
      errorCount: filteredStatuses.filter(([, status]) => status.error).length,
      unchangedCount: filteredStatuses.filter(([, status]) => 
        !status.loading && !status.comparing && !status.hasChanges && !status.error
      ).length
    };
  };

  // Get current counts based on filtered movies
  const { loadingCount, comparingCount, changedCount, errorCount, unchangedCount } = getStatusCounts();

  // Compare movie from API with DB version
  const compareMovies = (apiMovie: KKApiMovie, dbMovie: MovieResult): string[] => {
    const changedFields: string[] = [];
    
    // Only compare episode_current
    if (apiMovie.episode_current !== dbMovie.episodeCurrent) {
      changedFields.push('episode_current');
    }
    
    return changedFields;
  };

  // Fetch movie details from KKPhim API - only process non-single movies
  const fetchMovieDetails = useCallback(async (movies: MovieResult[]) => {
    // Non-single movies first
    const moviesToFetch = movies.filter(movie => 
      movie.typeSlug !== 'single'
    );
    
    if (moviesToFetch.length === 0) {
      toast.error("No multi-episode movies selected for update check");
      return;
    }

    // Mark as fetching
    fetchingRef.current = true;
    setIsProcessing(true);
    
    const initialStatus: UpdateStatus = {};
    moviesToFetch.forEach(movie => {
      initialStatus[movie.id] = { 
        loading: true,
        comparing: false,
        hasChanges: false,
        dbMovie: movie
      };
    });
    
    setUpdateStatus(initialStatus);
    
    pendingFetchesRef.current = new Set(moviesToFetch.map(m => m.slug));
    
    const MAX_CONCURRENT_REQUESTS = 5;
    
    const processBatch = async (batch: MovieResult[]) => {
      await Promise.all(batch.map(async (movie) => {
        if (!fetchingRef.current || !pendingFetchesRef.current.has(movie.slug)) return;
        
        try {
          setUpdateStatus(prev => ({
            ...prev,
            [movie.id]: {
              ...prev[movie.id],
              comparing: true
            }
          }));
          
          // Get details from API
          const result = await getMovieDetail(movie.slug);
          
          // Skip updating if we're no longer fetching
          if (!fetchingRef.current || !pendingFetchesRef.current.has(movie.slug)) return;
          
          // Remove from pending set
          pendingFetchesRef.current.delete(movie.slug);
          
          if (result.error || !result.movie) {
            setUpdateStatus(prev => ({
              ...prev,
              [movie.id]: {
                loading: false,
                comparing: false,
                hasChanges: false,
                error: result.error || "Failed to fetch movie details",
                dbMovie: movie
              }
            }));
            return;
          }
          
          // Compare with DB version
          const changedFields = compareMovies(result.movie, movie);
          const hasChanges = changedFields.length > 0;
          
          // Update status with result
          setUpdateStatus(prev => ({
            ...prev,
            [movie.id]: {
              loading: false,
              comparing: false,
              hasChanges,
              changedFields,
              detailedMovie: result.movie,
              episodes: result.episodes,
              dbMovie: movie
            }
          }));
        } catch (error) {
          // Skip updating if we're no longer fetching
          if (!fetchingRef.current || !pendingFetchesRef.current.has(movie.slug)) return;
          
          // Remove from pending set
          pendingFetchesRef.current.delete(movie.slug);
          
          // Update status with error
          setUpdateStatus(prev => ({
            ...prev,
            [movie.id]: {
              loading: false,
              comparing: false,
              hasChanges: false,
              error: error instanceof Error ? error.message : "Failed to process movie",
              dbMovie: movie
            }
          }));
          console.error("Error processing movie:", error);
        }
      }));
    };
    
    // Process movies in batches
    for (let i = 0; i < moviesToFetch.length; i += MAX_CONCURRENT_REQUESTS) {
      if (!fetchingRef.current) break;
      
      const batch = moviesToFetch.slice(i, i + MAX_CONCURRENT_REQUESTS);
      await processBatch(batch);
    }
    
    setIsProcessing(false);
  }, []);

  // Start fetching when the modal opens
  useEffect(() => {
    if (isOpen && selectedMovies.length > 0 && !fetchingRef.current) {
      fetchMovieDetails(selectedMovies);
    }
    
    // Cleanup function 
    return () => {
      fetchingRef.current = false;
      pendingFetchesRef.current.clear();
    };
  }, [isOpen, selectedMovies, fetchMovieDetails]);

  // Reset state when modal closes
  const handleClose = () => {
    // Mark as not fetching to prevent new state updates
    fetchingRef.current = false;
    pendingFetchesRef.current.clear();
    
    // Reset state
    setUpdateStatus({});
    setActiveTab("all");
    onClose();
  };

  // Handle submission of updates
  const handleUpdate = async () => {
    const moviesWithChanges = Object.entries(updateStatus)
      .filter(([, status]) => 
        status.detailedMovie && 
        status.episodes && 
        !status.loading && 
        !status.comparing && 
        status.hasChanges && 
        !status.error
      )
      .map(([, status]) => ({
        movie: status.detailedMovie!,
        episodes: status.episodes!
      }));
    
    if (moviesWithChanges.length === 0) {
      toast.error("No movies with changes to update");
      return;
    }
    
    setIsSubmitting(true);
    const loadingToast = toast.loading(`Updating ${moviesWithChanges.length} movies...`);
    
    try {
      // Format data for import using the same function as import modal
      const updateData = formatImportMoviesArray(
        moviesWithChanges.map(item => item.movie),
        moviesWithChanges.map(item => ({ 
          movieSlug: item.movie.slug, 
          episodes: item.episodes 
        }))
      );

      // Send to our update endpoint instead of import
      const response = await axios.post('/api/movies/update-movies', updateData);
      const results = response.data.results;
      toast.dismiss(loadingToast);

      // Prepare success and failure messages
      const successParts = [];
      if (results.movies.updated > 0) successParts.push(`updated ${results.movies.updated} movies`);
      if (results.episodes.added > 0) successParts.push(`added ${results.episodes.added} new episodes`);
      if (results.episodeServers.added > 0) successParts.push(`added ${results.episodeServers.added} new servers`);
      if (successParts.length > 0) {
        toast.success(`Successfully ${successParts.join(", ")}.`);
      }

      const failureParts = [];
      if (results.movies.failed > 0) failureParts.push(`failed to update ${results.movies.failed} movies`);
      if (results.episodes.failed > 0) failureParts.push(`failed to update ${results.episodes.failed} episodes`);
      if (results.episodeServers.failed > 0) failureParts.push(`failed to update ${results.episodeServers.failed} servers`);
      if (failureParts.length > 0) {
        toast.error(failureParts.join(", ") + ".");
      }

      if (onMoviesUpdated) onMoviesUpdated();
      handleClose();
    } catch (error) {
      toast.dismiss(loadingToast);
      
      console.error("Update error:", error);
      toast.error(
        error instanceof Error 
          ? `Update failed: ${error.message}` 
          : "Update failed: An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Bulk Update Episodes"
      description={`Check and update episodes for ${processableMovies.length} movies from KKPhim API`}
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-full sm:max-w-[90%] md:max-w-[75%] lg:max-w-[65%] xl:max-w-[50%] 2xl:max-w-[900px]"
    >
      <div className="space-y-4">
        {/* Status summary */}
        <StatusSummary
          selectedCount={filteredMovies.length}
          loadingCount={loadingCount}
          comparingCount={comparingCount}
          changedCount={changedCount}
          errorCount={errorCount}
          unchangedCount={unchangedCount}
          excludedSingleCount={excludedSingleMoviesCount}
          excludedCompletedCount={excludedCompletedMoviesCount}
          isProcessing={isProcessing}
        />

        {/* Movie type filter tabs */}
        <BulkUpdateTypeFilters
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          typeCounts={typeCounts}
        >
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredMovies.map((movie) => (
                <UpdateMovieCard
                  key={movie.id}
                  movie={movie}
                  status={updateStatus[movie.id] || { loading: true, comparing: false, hasChanges: false }}
                />
              ))}
            </div>
          </ScrollArea>
        </BulkUpdateTypeFilters>

        <Separator className="my-2" />

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing || isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isProcessing || isSubmitting || changedCount === 0}
            className="gap-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Update {changedCount} Movies
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};