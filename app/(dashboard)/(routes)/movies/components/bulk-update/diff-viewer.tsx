"use client";

import { KKApiMovie } from "@/types/kkapi";
import { MovieResult } from "@/types/backendType";
import { ArrowRight } from "lucide-react";

interface DiffViewerProps {
  changedFields: string[];
  apiMovie: KKApiMovie;
  dbMovie: MovieResult;
}

export function DiffViewer({ changedFields, apiMovie, dbMovie }: DiffViewerProps) {
  if (changedFields.length === 0) {
    return <p className="text-xs text-muted-foreground">No changes detected.</p>;
  }

  const hasEpisodeChange = changedFields.includes('episode_current');
  
  if (!hasEpisodeChange) {
    return <p className="text-xs text-muted-foreground">No episode updates needed.</p>;
  }

  // Get current and new episode values
  const currentEpisode = dbMovie.episodeCurrent || 'N/A';
  const newEpisode = apiMovie.episode_current || 'N/A';
  
  return (
    <div className="space-y-2">
      <h5 className="font-medium text-sm">Episode Update Available</h5>
      
      <div className="flex items-center justify-center py-3 px-4 bg-muted/30 rounded-md">
        <div className="text-center px-4 py-2 bg-background rounded-md border w-1/3">
          <div className="text-xs text-muted-foreground mb-1">Current</div>
          <div className="text-lg font-semibold">{currentEpisode}</div>
        </div>
        
        <ArrowRight className="mx-4 text-muted-foreground h-5 w-5" />
        
        <div className="text-center px-4 py-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800/40 w-1/3">
          <div className="text-xs text-muted-foreground mb-1">New</div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">{newEpisode}</div>
        </div>
      </div>
    </div>
  );
}