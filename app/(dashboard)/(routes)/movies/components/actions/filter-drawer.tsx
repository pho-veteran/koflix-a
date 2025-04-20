"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type MovieFiltersUpdate = {
  typeId?: string | null;
  genreIds?: string[];
  countryId?: string | null;
  startYear?: number | undefined;
  endYear?: number | undefined;
};

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTypeId: string | null;
  selectedGenreIds: string[];
  selectedCountryId: string | null;
  yearRange: [number | undefined, number | undefined];
  onFilterChange: (filters: MovieFiltersUpdate) => void;
}

type FilterOption = { id: string; name: string };

export function FilterDrawer({
  open,
  onOpenChange,
  selectedTypeId,
  selectedGenreIds,
  selectedCountryId,
  yearRange,
  onFilterChange
}: FilterDrawerProps) {
  const [typeId, setTypeId] = useState<string | null>(selectedTypeId);
  const [genreIds, setGenreIds] = useState<string[]>(selectedGenreIds);
  const [countryId, setCountryId] = useState<string | null>(selectedCountryId);
  const [yearSlider, setYearSlider] = useState<[number, number]>([
    yearRange[0] || 1900,
    yearRange[1] || new Date().getFullYear()
  ]);

  const [types, setTypes] = useState<FilterOption[]>([]);
  const [genres, setGenres] = useState<FilterOption[]>([]);
  const [countries, setCountries] = useState<FilterOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // Count active filters
  const activeFiltersCount =
    (typeId ? 1 : 0) +
    (genreIds.length > 0 ? 1 : 0) +
    (countryId ? 1 : 0) +
    ((yearSlider[0] !== 1900 || yearSlider[1] !== new Date().getFullYear()) ? 1 : 0);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const [typesRes, genresRes, countriesRes] = await Promise.all([
          axios.get('/api/movie-types'),
          axios.get('/api/genres'),
          axios.get('/api/countries')
        ]);

        setTypes(typesRes.data || []);
        setGenres(genresRes.data || []);
        setCountries(countriesRes.data || []);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    if (open) {
      fetchFilterOptions();
    }
  }, [open]);

  useEffect(() => {
    setTypeId(selectedTypeId);
    setGenreIds(selectedGenreIds);
    setCountryId(selectedCountryId);
    setYearSlider([
      yearRange[0] || 1900,
      yearRange[1] || new Date().getFullYear()
    ]);
  }, [selectedTypeId, selectedGenreIds, selectedCountryId, yearRange, open]);

  const handleApplyFilters = () => {
    onFilterChange({
      typeId,
      genreIds,
      countryId,
      startYear: yearSlider[0] === 1900 ? undefined : yearSlider[0],
      endYear: yearSlider[1] === new Date().getFullYear() ? undefined : yearSlider[1]
    });
    onOpenChange(false);
  };

  const handleResetFilters = () => {
    setTypeId(null);
    setGenreIds([]);
    setCountryId(null);
    setYearSlider([1900, new Date().getFullYear()]);
  };

  const renderSkeletons = (count: number, type: 'radio' | 'checkbox') => (
    Array.from({ length: count }).map((_, i) => (
      <div key={`skel-${type}-${i}`} className="flex items-center space-x-2 py-1">
        <Skeleton className={`h-4 w-4 ${type === 'radio' ? 'rounded-full' : 'rounded'}`} />
        <Skeleton className="h-4 w-24" />
      </div>
    ))
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex flex-col w-full max-w-md p-0 gap-0 overflow-hidden border-l h-full"
        side="right"
      >
        <div className="p-6 border-b shrink-0">
          <SheetHeader className="text-left px-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">Filter Movies</SheetTitle>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount} active
                </Badge>
              )}
            </div>
            <SheetDescription className="text-sm mt-1.5">
              Refine your movie collection by different criteria
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-6 py-4">
            <div className="space-y-6 pb-6">
              {/* Movie Types */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Movie Type</Label>
                  {typeId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 px-2 text-xs"
                      onClick={() => setTypeId(null)}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {isLoadingOptions ? (
                  <div className="grid grid-cols-2 gap-3">{renderSkeletons(4, 'radio')}</div>
                ) : (
                  <RadioGroup
                    value={typeId || ""}
                    onValueChange={(value) => setTypeId(value || null)}
                    className="grid grid-cols-2 gap-y-2"
                  >
                    <div className="flex items-center gap-2 py-1">
                      <RadioGroupItem value="" id="type-all" />
                      <Label
                        htmlFor="type-all"
                        className={`font-normal ${!typeId ? 'font-medium' : ''}`}
                      >
                        All Types
                      </Label>
                    </div>
                    {types.map(type => (
                      <div key={type.id} className="flex items-center gap-2 py-1">
                        <RadioGroupItem value={type.id} id={`type-${type.id}`} />
                        <Label
                          htmlFor={`type-${type.id}`}
                          className={`font-normal ${typeId === type.id ? 'font-medium' : ''}`}
                        >
                          {type.name}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>

              <Separator />

              {/* Genres */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Genres</Label>
                  {genreIds.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 px-2 text-xs"
                      onClick={() => setGenreIds([])}
                    >
                      Clear {genreIds.length > 0 && `(${genreIds.length})`}
                    </Button>
                  )}
                </div>

                {isLoadingOptions ? (
                  <div className="grid grid-cols-2 gap-3">{renderSkeletons(6, 'checkbox')}</div>
                ) : (
                  <div className="grid grid-cols-2 gap-y-2 pr-3 max-h-52 overflow-y-auto">
                    {genres.map(genre => (
                      <div key={genre.id} className="flex items-center gap-2 py-1">
                        <Checkbox
                          id={`genre-${genre.id}`}
                          checked={genreIds.includes(genre.id)}
                          onCheckedChange={(checked) => {
                            setGenreIds(prev =>
                              checked
                                ? [...prev, genre.id]
                                : prev.filter(id => id !== genre.id)
                            );
                          }}
                        />
                        <Label
                          htmlFor={`genre-${genre.id}`}
                          className={`font-normal ${genreIds.includes(genre.id) ? 'font-medium' : ''}`}
                        >
                          {genre.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Countries */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Country</Label>
                  {countryId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 px-2 text-xs"
                      onClick={() => setCountryId(null)}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {isLoadingOptions ? (
                  <div className="grid grid-cols-2 gap-3">{renderSkeletons(4, 'radio')}</div>
                ) : (
                  <div className="pr-3 max-h-40 overflow-y-auto">
                    <RadioGroup
                      value={countryId || ""}
                      onValueChange={(value) => setCountryId(value || null)}
                      className="grid grid-cols-2 gap-y-2"
                    >
                      <div className="flex items-center gap-2 py-1">
                        <RadioGroupItem value="" id="country-all" />
                        <Label
                          htmlFor="country-all"
                          className={`font-normal ${!countryId ? 'font-medium' : ''}`}
                        >
                          All Countries
                        </Label>
                      </div>
                      {countries.map(country => (
                        <div key={country.id} className="flex items-center gap-2 py-1">
                          <RadioGroupItem value={country.id} id={`country-${country.id}`} />
                          <Label
                            htmlFor={`country-${country.id}`}
                            className={`font-normal ${countryId === country.id ? 'font-medium' : ''}`}
                          >
                            {country.name}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </div>

              <Separator />

              {/* Year Range */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Year Range</Label>
                  {(yearSlider[0] !== 1900 || yearSlider[1] !== new Date().getFullYear()) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 px-2 text-xs"
                      onClick={() => setYearSlider([1900, new Date().getFullYear()])}
                    >
                      Reset
                    </Button>
                  )}
                </div>

                <div className="px-2">
                  <div className="flex justify-between items-center mb-5">
                    <Badge variant="outline" className="py-1.5 font-mono">
                      {yearSlider[0]}
                    </Badge>
                    <Badge variant="outline" className="py-1.5 font-mono">
                      {yearSlider[1]}
                    </Badge>
                  </div>

                  <Slider
                    min={1900}
                    max={new Date().getFullYear()}
                    step={1}
                    value={yearSlider}
                    onValueChange={(value) => setYearSlider(value as [number, number])}
                    className="my-5"
                  />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1900</span>
                    <span>{new Date().getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="p-4 border-t bg-background shrink-0">
          <SheetFooter className="flex-row sm:space-x-2">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              disabled={isLoadingOptions || activeFiltersCount === 0}
              className="flex-1"
            >
              Reset All
            </Button>
            <Button
              onClick={handleApplyFilters}
              disabled={isLoadingOptions}
              className="flex-1"
            >
              Apply Filters
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}