import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    RefreshCw,
    FileDown,
    Search,
} from "lucide-react";
import { SettingsPopover, SelectionPopover } from "./action-popovers";

interface ActionBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    pagesPerLoad: number;
    onPagesPerLoadChange: (value: number[]) => void;
    selectedCount: number;
    filteredCount: number;
    movieTypeCounts: {
        series: number;
        single: number;
        tvshows: number;
        anime: number;
    };
    onSelectByType: (type: string | null) => void;
    onImportSelected: () => void;
    onRefresh: () => void;
    isLoading: boolean;
}

export function ActionBar({
    searchQuery,
    onSearchChange,
    pagesPerLoad,
    onPagesPerLoadChange,
    selectedCount,
    filteredCount,
    movieTypeCounts,
    onSelectByType,
    onImportSelected,
    onRefresh,
    isLoading
}: ActionBarProps) {
    return (
        <Card className="mb-6 bg-background p-0 w-full sticky z-20 top-16 shadow-sm">
            <CardContent className="p-3 md:p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Search */}
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                        <Input
                            placeholder="Search by title in current page..."
                            className="pl-9 w-full"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    {/* Middle section with settings popover */}
                    <div className="hidden md:flex md:flex-1 justify-center">
                        <SettingsPopover 
                            pagesPerLoad={pagesPerLoad}
                            onPagesPerLoadChange={onPagesPerLoadChange}
                        />
                    </div>

                    {/* Actions section */}
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="md:hidden">
                            <SettingsPopover 
                                pagesPerLoad={pagesPerLoad}
                                onPagesPerLoadChange={onPagesPerLoadChange}
                            />
                        </div>
                        
                        <div className="flex gap-2">
                            <SelectionPopover 
                                onSelectByType={onSelectByType}
                                filteredCount={filteredCount}
                                movieTypeCounts={movieTypeCounts}
                            />

                            <Button
                                size="sm"
                                variant={selectedCount > 0 ? "default" : "outline"}
                                className="gap-1 whitespace-nowrap"
                                disabled={selectedCount === 0 || isLoading}
                                onClick={onImportSelected}
                            >
                                <FileDown className="h-4 w-4" />
                                Import ({selectedCount})
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                disabled={isLoading}
                                onClick={onRefresh}
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}