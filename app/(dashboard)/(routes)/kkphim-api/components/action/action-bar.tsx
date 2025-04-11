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
        <Card className="mb-6 bg-background p-0 w-full sticky z-20 top-16">
            <CardContent className="p-0">
                <div className="p-4 md:px-6 flex flex-wrap gap-3 items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                        <Input
                            placeholder="Search by title in current page..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    {/* Settings Popover */}
                    <SettingsPopover 
                        pagesPerLoad={pagesPerLoad}
                        onPagesPerLoadChange={onPagesPerLoadChange}
                    />

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                        <SelectionPopover 
                            onSelectByType={onSelectByType}
                            filteredCount={filteredCount}
                            movieTypeCounts={movieTypeCounts}
                        />

                        <Button
                            size="sm"
                            variant={selectedCount > 0 ? "default" : "outline"}
                            className="gap-1"
                            disabled={selectedCount === 0 || isLoading}
                            onClick={onImportSelected}
                        >
                            <FileDown className="h-4 w-4" />
                            Import Selected ({selectedCount})
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={isLoading}
                            onClick={onRefresh}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}