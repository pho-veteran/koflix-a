"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Episode, EpisodeServer } from "@prisma/client";
import { 
  Plus, 
  Edit, 
  Trash, 
  Film, 
  Server, 
  Info,
  Loader2
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Extend the Episode and EpisodeServer types with custom fields
interface ExtendedEpisodeServer extends EpisodeServer {
  name?: string;
  linkName?: string;
}

interface ExtendedEpisode extends Episode {
  servers: ExtendedEpisodeServer[];
  isTrailer?: boolean;
}

interface EpisodeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieId: string;
  movieName: string;
}

export const EpisodeSelectorModal = ({
  isOpen,
  onClose,
  movieId,
  movieName,
}: EpisodeSelectorModalProps) => {
  const router = useRouter();
  const [episodes, setEpisodes] = useState<ExtendedEpisode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingEpisodeId, setDeletingEpisodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch episodes when the modal opens
  useEffect(() => {
    if (isOpen && movieId) {
      fetchEpisodes();
    }
  });

  const fetchEpisodes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/movies/episodes/${movieId}`);
      setEpisodes(response.data.episodes);
    } catch (error) {
      console.error("Failed to fetch episodes:", error);
      setError("Failed to load episodes. Please try again.");
      
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || "Failed to load episodes");
      } else {
        toast.error("An unexpected error occurred while loading episodes");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sortedEpisodes = [...episodes].sort((a, b) => {
    // Try to extract numeric part if available
    const aNum = parseInt(a.name.replace(/\D/g, ''));
    const bNum = parseInt(b.name.replace(/\D/g, ''));
    
    // If both have numeric parts, sort by number
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    
    // Otherwise sort alphabetically
    return a.name.localeCompare(b.name);
  });

  const handleCreateEpisode = () => {
    router.push(`/movies/${movieId}/new`);
    onClose();
  };

  const handleEditEpisode = (episodeId: string) => {
    router.push(`/movies/${movieId}/${episodeId}`);
    onClose();
  };

  const handleDeleteEpisode = async (episodeId: string) => {
    try {
      setIsDeleting(true);
      setDeletingEpisodeId(episodeId);

      // API call to delete the episode
      await axios.delete(`/api/movies/episodes/${movieId}/${episodeId}`);
      
      // Remove the episode from the local state
      setEpisodes(episodes.filter(ep => ep.id !== episodeId));
      
      toast.success("Episode deleted successfully");
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to delete episode");
      } else {
        toast.error("An unexpected error occurred");
      }
      console.error("Error deleting episode:", error);
    } finally {
      setIsDeleting(false);
      setDeletingEpisodeId(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading episodes...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[200px] text-center p-4 space-y-3">
          <Info className="h-10 w-10 text-destructive" />
          <div>
            <p className="text-lg font-medium">Failed to load episodes</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              onClick={fetchEpisodes} 
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    if (episodes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[200px] text-center p-4 space-y-3">
          <Info className="h-10 w-10 text-muted-foreground opacity-50" />
          <div>
            <p className="text-lg font-medium">No episodes yet</p>
            <p className="text-sm text-muted-foreground">
              Get started by creating your first episode
            </p>
          </div>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[350px] pr-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Episode</TableHead>
              <TableHead>Servers</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEpisodes.map((episode) => (
              <TableRow key={episode.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{episode.name}</span>
                    {episode.isTrailer && (
                      <Badge variant="outline" className="text-xs">Trailer</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {episode.servers.map((server) => (
                      <TooltipProvider key={server.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="secondary" 
                              className="flex items-center gap-1 cursor-help"
                            >
                              <Server className="h-3 w-3" />
                              {server.name || server.server_name}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>{server.linkName || "Default Server"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    {episode.servers.length === 0 && (
                      <span className="text-xs text-muted-foreground">No servers</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditEpisode(episode.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Episode
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteEpisode(episode.id)}
                          className="text-destructive"
                          disabled={isDeleting && deletingEpisodeId === episode.id}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          {isDeleting && deletingEpisodeId === episode.id 
                            ? "Deleting..." 
                            : "Delete Episode"
                          }
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            Episodes for {movieName}
          </DialogTitle>
          <DialogDescription>
            Manage episodes and servers for this movie
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-2">
          {renderContent()}
        </div>

        <Separator />

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCreateEpisode} className="gap-1">
            <Plus className="h-4 w-4" />
            Create Episode
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};