"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  Plus,
  Server
} from "lucide-react";

import { Episode, EpisodeServer, Movie } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import EpisodeForm from "./episode-form";
import EpisodeServerForm from "./episode-server-form";

type EpisodeWithServers = Episode & {
  movie?: {
    name: string;
    slug: string;
  };
  servers: EpisodeServer[];
};

interface EpisodeClientProps {
  initialData: EpisodeWithServers | null;
  movie: Movie;
  isNew: boolean;
}

const EpisodeClient: React.FC<EpisodeClientProps> = ({
  initialData,
  movie,
  isNew
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [editMode, setEditMode] = useState(isNew);
  
  // Server management state
  const [selectedServer, setSelectedServer] = useState<EpisodeServer | null>(null);
  const [isServerMode, setIsServerMode] = useState(false);
  const [deleteServerModalOpen, setDeleteServerModalOpen] = useState(false);
  const [episodeServers, setEpisodeServers] = useState<EpisodeServer[]>(initialData?.servers || []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDeleteServer = async () => {
    if (!selectedServer || !initialData) return;
    
    try {
      setIsLoading(true);

      await axios.delete(`/api/movies/episodes/${movie.id}/${initialData.id}/${selectedServer.id}`, {
        timeout: 10000
      });

      // Update local state by removing the deleted server
      setEpisodeServers(prev => prev.filter(server => server.id !== selectedServer.id));
      toast.success('Server deleted successfully!');
      
      // Exit server edit mode
      setSelectedServer(null);
      setIsServerMode(false);
      
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to delete server');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
      setDeleteServerModalOpen(false);
    }
  };

  const handleServerCreated = (server: EpisodeServer) => {
    setEpisodeServers(prev => [...prev, server]);
    setIsServerMode(false);
    setSelectedServer(null);
  };

  const handleServerUpdated = (updatedServer: EpisodeServer) => {
    setEpisodeServers(prev => 
      prev.map(server => server.id === updatedServer.id ? updatedServer : server)
    );
    setIsServerMode(false);
    setSelectedServer(null);
  };

  const handleAddServer = () => {
    setSelectedServer(null);
    setIsServerMode(true);
  };

  const handleEditServer = (server: EpisodeServer) => {
    setSelectedServer(server);
    setIsServerMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  const handleStartEdit = () => {
    setEditMode(true);
    setIsServerMode(false);
  };

  const handleEpisodeUpdated = () => {
    setEditMode(false);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="pb-10">
      {/* Delete Server Confirmation Dialog */}
      <Dialog open={deleteServerModalOpen} onOpenChange={setDeleteServerModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Server</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this server? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteServerModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteServer}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/movies/${movie.id}`)}
          className="gap-1"
        >
          <ArrowLeft size={16} />
          Back to movie
        </Button>

        {!isNew && !editMode && !isServerMode && (
          <div className="flex gap-2">
            <Button
              onClick={handleStartEdit}
              variant="outline"
              className="gap-1"
            >
              <Edit size={16} />
              Edit Episode
            </Button>
          </div>
        )}

        {isServerMode && (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => {
                setIsServerMode(false);
                setSelectedServer(null);
              }}
              variant="outline"
              className="gap-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Movie info header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{movie.name}</h1>
        {!isNew && !isServerMode && (
          <p className="text-muted-foreground">
            Episode: {initialData?.name}
          </p>
        )}
        {isServerMode && (
          <p className="text-muted-foreground">
            {selectedServer ? `Edit Server: ${selectedServer.server_name}` : 'Add New Server'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Episode Servers */}
        <Card className="lg:col-span-1 overflow-hidden flex flex-col h-min">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Server size={18} className="text-muted-foreground" />
              Episode Servers
            </CardTitle>
            <CardDescription>
              Manage streaming servers for this episode
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {!isNew && !isLoading && initialData && (
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2 justify-center"
                onClick={handleAddServer}
                disabled={isServerMode}
              >
                <Plus size={16} />
                Add Server
              </Button>
            )}

            <div className="space-y-2">
              {episodeServers.length > 0 ? (
                episodeServers.map((server) => (
                  <div 
                    key={server.id} 
                    className={`p-3 border rounded-md flex justify-between items-center cursor-pointer hover:bg-accent/50 ${selectedServer?.id === server.id ? 'bg-accent' : ''}`}
                    onClick={() => !isServerMode && handleEditServer(server)}
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        <Server size={14} className="text-muted-foreground" />
                        {server.server_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {server.filename || 'No filename'}
                      </div>
                      {server.link_m3u8 && (
                        <Badge variant="outline" className="text-xs">
                          HLS Stream
                        </Badge>
                      )}
                    </div>
                    {!isServerMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedServer(server);
                          setDeleteServerModalOpen(true);
                        }}
                      >
                        <Trash size={14} className="text-destructive" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {isNew 
                    ? "Save the episode first to add servers" 
                    : "No servers added yet. Click 'Add Server' to create one."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right column - Form (Episode or Server) */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            {isServerMode && initialData ? (
              <EpisodeServerForm 
                movieId={movie.id}
                episodeId={initialData.id}
                initialData={selectedServer}
                onSuccess={selectedServer ? handleServerUpdated : handleServerCreated}
                onCancel={() => {
                  setIsServerMode(false);
                  setSelectedServer(null);
                }}
              />
            ) : (
              <EpisodeForm 
                initialData={initialData}
                movie={movie}
                isNew={isNew}
                isEditing={editMode}
                onCancel={handleCancelEdit}
                onSuccess={handleEpisodeUpdated}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EpisodeClient;