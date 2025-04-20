import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    CheckSquare,
    ChevronDown,
    Check,
    X,
    Layers,
    BookOpen,
    Tv,
    Gamepad2
} from "lucide-react";

interface SelectionPopoverProps {
    onSelectByType: (type: string | null) => void;
    filteredCount: number;
    movieTypeCounts: {
        series: number;
        single: number;
        tvshows: number;
        anime: number;
    };
}

export function SelectionPopover({ onSelectByType, filteredCount, movieTypeCounts }: SelectionPopoverProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                >
                    <CheckSquare className="h-4 w-4" />
                    Select
                    <ChevronDown className="h-3 w-3 opacity-70" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm leading-none">Selection Options</h4>
                    </div>
                    
                    {/* Quick actions */}
                    <div className="flex items-center gap-2">
                        <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 px-3" 
                            onClick={() => onSelectByType('all')}
                        >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            All ({filteredCount})
                        </Button>
                        
                        <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 px-3" 
                            onClick={() => onSelectByType(null)}
                        >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Clear
                        </Button>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    {/* Movie type buttons */}
                    <div>
                        <h5 className="text-xs text-muted-foreground mb-2">Select by Type</h5>
                        <div className="grid grid-cols-2 gap-2">
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="justify-start" 
                                onClick={() => onSelectByType('series')}
                            >
                                <Layers className="mr-2 h-3.5 w-3.5 text-blue-500" />
                                Series
                                <Badge variant="secondary" className="ml-auto">
                                    {movieTypeCounts.series}
                                </Badge>
                            </Button>
                            
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="justify-start" 
                                onClick={() => onSelectByType('single')}
                            >
                                <BookOpen className="mr-2 h-3.5 w-3.5 text-amber-500" />
                                Movies
                                <Badge variant="secondary" className="ml-auto">
                                    {movieTypeCounts.single}
                                </Badge>
                            </Button>
                            
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="justify-start" 
                                onClick={() => onSelectByType('tvshows')}
                            >
                                <Tv className="mr-2 h-3.5 w-3.5 text-green-500" />
                                TV Shows
                                <Badge variant="secondary" className="ml-auto">
                                    {movieTypeCounts.tvshows}
                                </Badge>
                            </Button>
                            
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="justify-start" 
                                onClick={() => onSelectByType('hoathinh')}
                            >
                                <Gamepad2 className="mr-2 h-3.5 w-3.5 text-purple-500" />
                                Anime
                                <Badge variant="secondary" className="ml-auto">
                                    {movieTypeCounts.anime}
                                </Badge>
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}