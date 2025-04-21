"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper function for display names
function getMovieTypeDisplay(type: string): string {
  switch (type) {
    case 'series': return 'Series';
    case 'tvshows': return 'TV Shows';
    case 'hoathinh': 
    case 'anime': return 'Anime';
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

interface TypeCounts {
  all: number;
  series: number;
  tvshows: number;
  anime: number;
}

interface BulkUpdateTypeFiltersProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  typeCounts: TypeCounts;
  children: React.ReactNode;
}

export function BulkUpdateTypeFilters({ 
  activeTab, 
  setActiveTab, 
  typeCounts, 
  children 
}: BulkUpdateTypeFiltersProps) {
  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4 w-full">
        <TabsTrigger value="all" className="flex-1">
          All ({typeCounts.all})
        </TabsTrigger>
        <TabsTrigger value="series" className="flex-1">
          {getMovieTypeDisplay('series')} ({typeCounts.series})
        </TabsTrigger>
        <TabsTrigger value="tvshows" className="flex-1">
          {getMovieTypeDisplay('tvshows')} ({typeCounts.tvshows})
        </TabsTrigger>
        <TabsTrigger value="anime" className="flex-1">
          {getMovieTypeDisplay('anime')} ({typeCounts.anime})
        </TabsTrigger>
      </TabsList>
      <TabsContent value={activeTab} className="mt-0">
        {children}
      </TabsContent>
    </Tabs>
  );
}