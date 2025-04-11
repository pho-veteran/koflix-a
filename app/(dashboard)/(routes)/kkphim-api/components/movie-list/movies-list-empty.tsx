import { Search } from "lucide-react";

export const MoviesListEmpty = () => {
    return (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
            <div className="flex justify-center mb-3">
                <div className="bg-muted/50 p-3 rounded-full">
                    <Search className="h-6 w-6 text-muted-foreground" />
                </div>
            </div>
            <h3 className="text-lg font-medium mb-1">No movies found</h3>
            <p className="text-muted-foreground">Try changing your search query or refreshing the page</p>
        </div>
    );
};