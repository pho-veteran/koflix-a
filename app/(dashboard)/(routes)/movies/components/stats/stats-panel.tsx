import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Film,
    LayoutGrid,
    Layers,
    BookOpen,
    Tv,
    Gamepad2,
    Clock
} from "lucide-react";

interface StatsPanelProps {
    totalMovies: number;
    filteredMovies: number;
    currentPage: number;
    totalPages: number;
    movieTypeCounts: {
        series: number;
        single: number;
        tvshows: number;
        anime: number;
    };
    isFiltered: boolean;
    queryTime?: number;
}

export const StatsPanel = ({
    totalMovies,
    filteredMovies,
    currentPage,
    totalPages,
    movieTypeCounts,
    isFiltered,
    queryTime
}: StatsPanelProps) => {
    // Shows number of filtered results out of total if filtering
    const statsPrefix = isFiltered ? `${filteredMovies} of ${totalMovies}` : filteredMovies;

    return (
        <Card className="mb-6 shadow-sm bg-transparent p-0">
            {queryTime && (
                <CardHeader className="pb-0 pt-3 px-6">
                    <div className="flex items-center justify-end text-xs text-muted-foreground gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Query time: {queryTime}ms</span>
                    </div>
                </CardHeader>
            )}
            <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-0">
                    {/* Total Movies */}
                    <div className="p-4 md:p-6 border-b md:border-r flex items-center gap-3 lg:col-span-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Film className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Movies</p>
                            <h3 className="text-xl font-semibold">{totalMovies.toLocaleString()}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">In database</p>
                        </div>
                    </div>

                    {/* Current Showing */}
                    <div className="p-4 md:p-6 border-b md:border-r flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Film className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Current Page</p>
                            <h3 className="text-xl font-semibold">{statsPrefix}</h3>
                            {isFiltered ? (
                                <p className="text-xs text-muted-foreground mt-0.5">Filtered results</p>
                            ) : (
                                <p className="text-xs text-muted-foreground mt-0.5">Current page</p>
                            )}
                        </div>
                    </div>

                    {/* Page */}
                    <div className="p-4 md:p-6 flex items-center gap-3 border-b">
                        <div className="bg-purple-500/10 p-2 rounded-full">
                            <LayoutGrid className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Page</p>
                            <h3 className="text-xl font-semibold">{currentPage}/{totalPages}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                24 per page
                            </p>
                        </div>
                    </div>

                    {/* Series */}
                    <div className="p-4 md:p-6 border-b md:border-r flex items-center gap-3 lg:border-b-0">
                        <div className="bg-blue-500/10 p-2 rounded-full">
                            <Layers className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Series</p>
                            <h3 className="text-xl font-semibold">{movieTypeCounts.series}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {Math.round((movieTypeCounts.series / filteredMovies) * 100) || 0}% of current
                            </p>
                        </div>
                    </div>

                    {/* Movies */}
                    <div className="p-4 md:p-6 border-b md:border-r flex items-center gap-3 lg:border-b-0">
                        <div className="bg-amber-500/10 p-2 rounded-full">
                            <BookOpen className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Movies</p>
                            <h3 className="text-xl font-semibold">{movieTypeCounts.single}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {Math.round((movieTypeCounts.single / filteredMovies) * 100) || 0}% of current
                            </p>
                        </div>
                    </div>

                    {/* TV Shows */}
                    <div className="p-4 md:p-6 flex items-center gap-3 border-b lg:border-b-0 lg:border-r">
                        <div className="bg-green-500/10 p-2 rounded-full">
                            <Tv className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">TV Shows</p>
                            <h3 className="text-xl font-semibold">{movieTypeCounts.tvshows}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {Math.round((movieTypeCounts.tvshows / filteredMovies) * 100) || 0}% of current
                            </p>
                        </div>
                    </div>

                    {/* Anime */}
                    <div className="p-4 md:p-6 flex items-center gap-3">
                        <div className="bg-purple-500/10 p-2 rounded-full">
                            <Gamepad2 className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Anime</p>
                            <h3 className="text-xl font-semibold">{movieTypeCounts.anime}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {Math.round((movieTypeCounts.anime / filteredMovies) * 100) || 0}% of current
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};