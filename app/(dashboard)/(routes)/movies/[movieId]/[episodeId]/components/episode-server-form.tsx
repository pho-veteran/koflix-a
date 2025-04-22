"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";

import { 
  Save, 
  Server,
  Video
} from "lucide-react";

import { EpisodeServer } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { VideoUpload } from "@/components/ui/video-upload";

// Define form schema with Zod
const formSchema = z.object({
  server_name: z.string().min(1, "Server name is required"),
  filename: z.string().optional(),
  link_embed: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  link_m3u8: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  link_mp4: z.string().url("Must be a valid URL").optional().or(z.literal(""))
});

type ServerFormValues = z.infer<typeof formSchema>;

interface EpisodeServerFormProps {
  movieId: string;
  episodeId: string;
  initialData: EpisodeServer | null;
  onSuccess: (server: EpisodeServer) => void;
  onCancel: () => void;
}

const EpisodeServerForm: React.FC<EpisodeServerFormProps> = ({
  movieId,
  episodeId,
  initialData,
  onSuccess,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const isNew = !initialData;

  const defaultValues = isNew 
    ? {
        server_name: "",
        filename: "",
        link_embed: "",
        link_m3u8: "",
        link_mp4: ""
      } 
    : {
        server_name: initialData.server_name,
        filename: initialData.filename || "",
        link_embed: initialData.link_embed || "",
        link_m3u8: initialData.link_m3u8 || "",
        link_mp4: initialData.link_mp4 || ""
      };

  const form = useForm<ServerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: ServerFormValues) => {
    try {
      setIsLoading(true);
        
      console.log("Form data:", data);
      const url = isNew 
        ? `/api/movies/episodes/${movieId}/${episodeId}` 
        : `/api/movies/episodes/${movieId}/${episodeId}/${initialData!.id}`;
  
      const axiosConfig = {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      };
  
      const { data: responseData } = isNew 
        ? await axios.post(url, data, axiosConfig)
        : await axios.patch(url, data, axiosConfig);
  
      toast.success(isNew ? 'Server created successfully!' : 'Server updated successfully!');
      onSuccess(responseData);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          toast.error('Request timed out. Please try again.');
        } else if (error.response) {
          const errorMsg = error.response.data?.error || 'Something went wrong';
          toast.error(errorMsg);
        } else {
          toast.error('Failed to connect to the server');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoUpload = (url: string) => {
    form.setValue("link_mp4", url);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Server size={18} className="text-muted-foreground" />
            {isNew ? 'Add New Server' : 'Edit Server'}
          </h3>

          <FormField
            control={form.control}
            name="server_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Server Name</FormLabel>
                <FormControl>
                  <Input 
                    disabled={isLoading}
                    placeholder="Enter server name (e.g. Main Server, Backup)" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  This is the display name for this server
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="filename"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Filename (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    disabled={isLoading}
                    placeholder="Descriptive filename" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="link_embed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Embedded Player URL (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    disabled={isLoading}
                    placeholder="https://example.com/embed/video" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  External player iframe URL
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator className="my-4" />

          <div className="space-y-4">
            <h3 className="text-base font-medium flex items-center gap-2">
              <Video size={18} className="text-muted-foreground" />
              HLS Video Stream
            </h3>

            <FormField
              control={form.control}
              name="link_m3u8"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HLS Stream URL (M3U8)</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={isLoading}
                      placeholder="https://example.com/video.m3u8" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Upload a video file or enter a direct URL to an M3U8 playlist
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link_mp4"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MP4 Direct URL</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={isLoading}
                      placeholder="https://example.com/video.mp4" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Direct link to MP4 video file
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <h4 className="text-sm font-medium mb-2">Upload Video</h4>
              <VideoUpload 
                onUploadComplete={(url) => handleVideoUpload(url)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="gap-1"
          >
            <Save size={16} />
            {isLoading ? "Saving..." : (isNew ? "Create Server" : "Update Server")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EpisodeServerForm;