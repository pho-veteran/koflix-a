"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMovieTypeDisplay } from "../utils/movie-helpers";

interface TypeCounts {
  all: number;
  series: number;
  single: number;
  tvshows: number;
  anime: number;
}

interface MovieTypeFiltersProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  typeCounts: TypeCounts;
  children: React.ReactNode;
}

export function MovieTypeFilters({ activeTab, setActiveTab, typeCounts, children }: MovieTypeFiltersProps) {
  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4 w-full flex">
        <TabsTrigger value="all" className="flex-1">
          All ({typeCounts.all})
        </TabsTrigger>
        <TabsTrigger value="series" className="flex-1">
          {getMovieTypeDisplay('series')} ({typeCounts.series})
        </TabsTrigger>
        <TabsTrigger value="single" className="flex-1">
          {getMovieTypeDisplay('single')} ({typeCounts.single})
        </TabsTrigger>
        <TabsTrigger value="tvshows" className="flex-1">
          {getMovieTypeDisplay('tvshows')} ({typeCounts.tvshows})
        </TabsTrigger>
        <TabsTrigger value="anime" className="flex-1">
          {getMovieTypeDisplay('hoathinh')} ({typeCounts.anime})
        </TabsTrigger>
      </TabsList>
      <TabsContent value={activeTab} className="mt-0">
        {children}
      </TabsContent>
    </Tabs>
  );
}