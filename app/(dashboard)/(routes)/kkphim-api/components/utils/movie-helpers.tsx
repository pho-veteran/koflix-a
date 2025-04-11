"use client";

import { Layers, Film, Tv, Gamepad2 } from "lucide-react";

// Helper function to get display name for movie type
export const getMovieTypeDisplay = (type: string): string => {
  switch (type) {
    case 'series':
      return 'Series';
    case 'single':
      return 'Movie';
    case 'tvshows':
      return 'TV Shows';
    case 'hoathinh':
      return 'Anime';
    default:
      return type;
  }
};

// Helper function to get icon for movie type
export const getMovieTypeIcon = (type: string) => {
  switch (type) {
    case 'series':
      return <Layers className="h-4 w-4 text-blue-500" />;
    case 'single':
      return <Film className="h-4 w-4 text-amber-500" />;
    case 'tvshows':
      return <Tv className="h-4 w-4 text-green-500" />;
    case 'hoathinh':
      return <Gamepad2 className="h-4 w-4 text-purple-500" />;
    default:
      return <Film className="h-4 w-4" />;
  }
};