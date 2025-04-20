import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FilterX, FilterIcon, Plus, ArrowUp, ArrowDown, Trash2, X } from "lucide-react";
import { FilterDrawer } from "./filter-drawer";
import { SelectionPopover } from "./selection-popover";
import { useState } from "react";

type MovieFiltersUpdate = {
    typeId?: string | null;
    genreIds?: string[];
    countryId?: string | null;
    startYear?: number | undefined;
    endYear?: number | undefined;
};

type SortOption = {
    label: string;
    value: string;
};

const SORT_OPTIONS: SortOption[] = [
    { label: 'Name', value: 'name' },
    { label: 'Year', value: 'year' },
    { label: 'Recently Updated', value: 'updatedAt' },
    { label: 'Recently Added', value: 'createdAt' },
    { label: 'Views', value: 'view' },
    { label: 'Rating', value: 'rating' }
];

interface ActionBarProps {
    searchInput: string;
    onSearchInputChange: (query: string) => void;
    onSearchSubmit: () => void;
    onSearchClear: () => void;
    selectedTypeId: string | null;
    selectedGenreIds: string[];
    selectedCountryId: string | null;
    yearRange: [number | undefined, number | undefined];
    onFilterChange: (filters: MovieFiltersUpdate) => void;
    isLoading: boolean;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    onSortChange: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
    isSelectMode: boolean;
    onToggleSelectMode: () => void;
    onSelectByType: (type: string | null) => void;
    movieTypeCounts: {
        series: number;
        single: number;
        tvshows: number;
        anime: number;
    };
    filteredCount: number;
}

export function ActionBar({
    searchInput,
    onSearchInputChange,
    onSearchSubmit,
    onSearchClear,
    selectedTypeId,
    selectedGenreIds,
    selectedCountryId,
    yearRange,
    onFilterChange,
    isLoading,
    sortBy,
    sortDirection,
    onSortChange,
    isSelectMode,
    onToggleSelectMode,
    onSelectByType,
    movieTypeCounts,
    filteredCount
}: ActionBarProps) {
    const [filterOpen, setFilterOpen] = useState(false);

    // Count active filters
    const activeFiltersCount = 
        (selectedTypeId ? 1 : 0) +
        (selectedGenreIds.length > 0 ? 1 : 0) +
        (selectedCountryId ? 1 : 0) +
        ((yearRange[0] !== undefined || yearRange[1] !== undefined) ? 1 : 0);

    // Clear all filters
    const handleClearFilters = () => {
        onFilterChange({
            typeId: null,
            genreIds: [],
            countryId: null,
            startYear: undefined,
            endYear: undefined
        });
    };

    // Toggle sort direction
    const handleToggleSortDirection = () => {
        onSortChange(sortBy, sortDirection === 'asc' ? 'desc' : 'asc');
    };

    // Handle search on Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSearchSubmit();
        }
    };

    return (
        <Card className="mb-6 bg-background p-0 w-full sticky z-20 top-16 shadow-sm">
            <CardContent className="p-3 md:p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Search with button */}
                    <div className="relative w-full sm:max-w-xs flex gap-2">
                        <div className="relative flex-1">
                            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                            <Input
                                placeholder="Search by title..."
                                className="pl-9 w-full pr-8"
                                value={searchInput}
                                onChange={(e) => onSearchInputChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading || isSelectMode}
                            />
                            {searchInput && (
                                <button 
                                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                                    onClick={onSearchClear}
                                    disabled={isLoading || isSelectMode}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Button 
                            size="sm" 
                            onClick={onSearchSubmit}
                            disabled={isLoading || isSelectMode}
                        >
                            Search
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:ml-auto">
                        {/* Don't show sorting when in select mode */}
                        {!isSelectMode && (
                            <div className="flex items-center gap-2">
                                <Select
                                    disabled={isLoading}
                                    value={sortBy}
                                    onValueChange={(value) => onSortChange(value, sortDirection)}
                                >
                                    <SelectTrigger className="w-auto min-w-[130px] h-9">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SORT_OPTIONS.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-9 w-9"
                                    onClick={handleToggleSortDirection}
                                    disabled={isLoading}
                                >
                                    {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                                </Button>
                            </div>
                        )}

                        {/* Filter Actions - hide when in select mode */}
                        {!isSelectMode && (
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant={activeFiltersCount > 0 ? "secondary" : "outline"}
                                    className="gap-1 h-9"
                                    onClick={() => setFilterOpen(true)}
                                    disabled={isLoading}
                                >
                                    <FilterIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">Filters</span>
                                    {activeFiltersCount > 0 && (
                                        <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">
                                            {activeFiltersCount}
                                        </span>
                                    )}
                                </Button>

                                {activeFiltersCount > 0 && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 h-9"
                                        onClick={handleClearFilters}
                                        disabled={isLoading}
                                    >
                                        <FilterX className="h-4 w-4" />
                                        <span className="hidden sm:inline">Clear</span>
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Selection popover or delete trigger button */}
                        {isSelectMode ? (
                            <SelectionPopover 
                                onSelectByType={onSelectByType}
                                filteredCount={filteredCount}
                                movieTypeCounts={movieTypeCounts}
                            />
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 h-9"
                                onClick={onToggleSelectMode}
                                disabled={isLoading}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Delete</span>
                            </Button>
                        )}

                        {/* New Movie Button */}
                        {!isSelectMode && (
                            <Button
                                size="sm"
                                variant="default"
                                className="gap-1 h-9 ml-auto sm:ml-0"
                                disabled={isLoading}
                                onClick={() => {/* Navigate to create movie page */}}
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">New Movie</span>
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>

            {/* Filter Drawer */}
            <FilterDrawer
                open={filterOpen && !isSelectMode}
                onOpenChange={(open) => !isSelectMode && setFilterOpen(open)}
                selectedTypeId={selectedTypeId}
                selectedGenreIds={selectedGenreIds}
                selectedCountryId={selectedCountryId}
                yearRange={yearRange}
                onFilterChange={onFilterChange}
            />
        </Card>
    );
}