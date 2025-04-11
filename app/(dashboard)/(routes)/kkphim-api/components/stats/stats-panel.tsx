import { Card, CardContent } from "@/components/ui/card";
import {
    Database,
    Film,
    LayoutGrid,
    Layers,
    BookOpen,
    Tv,
    Gamepad2
} from "lucide-react";

interface StatsPanelProps {
    apiTotalMovies: number;
    totalMovies: number;
    filteredMovies: number;
    currentPage: number;
    totalPages: number;
    pagesPerLoad: number;
    movieTypeCounts: {
        series: number;
        single: number;
        tvshows: number;
        anime: number;
    };
    isFiltered: boolean;
}

export const StatsPanel = ({
    apiTotalMovies,
    totalMovies,
    filteredMovies,
    currentPage,
    totalPages,
    pagesPerLoad,
    movieTypeCounts,
    isFiltered
}: StatsPanelProps) => {
    // Shows number of filtered results out of total if filtering
    const statsPrefix = isFiltered ? `${filteredMovies} of ${totalMovies}` : filteredMovies;

    return (
        <Card className="mb-6 shadow-sm bg-transparent p-0">
            <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-0">
                    {/* API Total Movies */}
                    <div className="p-4 md:p-6 border-b md:border-r flex items-center gap-3 lg:col-span-2">
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
                    <div className="p-4 md:p-6 border-b md:border-r flex items-center gap-3">
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

                    {/* Page */}
                    <div className="p-4 md:p-6 flex items-center gap-3 border-b">
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

                    {/* Series */}
                    <div className="p-4 md:p-6 border-b md:border-r flex items-center gap-3 lg:border-b-0">
                        <div className="bg-blue-500/10 p-2 rounded-full">
                            <Layers className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Series</p>
                            <h3 className="text-xl font-semibold">{movieTypeCounts.series}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {Math.round((movieTypeCounts.series / filteredMovies) * 100) || 0}% of loaded
                            </p>
                        </div>
                    </div>

                    {/* Movies */}
                    <div className="p-4 md:p-6 flex items-center gap-3 border-b md:border-r lg:border-b-0">
                        <div className="bg-amber-500/10 p-2 rounded-full">
                            <BookOpen className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Movies</p>
                            <h3 className="text-xl font-semibold">{movieTypeCounts.single}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {Math.round((movieTypeCounts.single / filteredMovies) * 100) || 0}% of loaded
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
                                {Math.round((movieTypeCounts.tvshows / filteredMovies) * 100) || 0}% of loaded
                            </p>
                        </div>
                    </div>

                    {/* Anime */}
                    <div className="p-4 md:p-6 flex items-center gap-3 md:border-r">
                        <div className="bg-purple-500/10 p-2 rounded-full">
                            <Gamepad2 className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Anime</p>
                            <h3 className="text-xl font-semibold">{movieTypeCounts.anime}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {Math.round((movieTypeCounts.anime / filteredMovies) * 100) || 0}% of loaded
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};