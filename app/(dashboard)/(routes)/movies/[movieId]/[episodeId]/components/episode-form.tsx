"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { format } from "date-fns";

import { 
  Save, 
  Film
} from "lucide-react";

import { Episode, EpisodeServer, Movie } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Define form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, "Episode name is required"),
  slug: z.string().min(1, "Slug is required"),
});

type EpisodeFormValues = z.infer<typeof formSchema>;

type EpisodeWithRelations = Episode & {
  movie?: {
    name: string;
    slug: string;
  };
  servers: EpisodeServer[];
};

interface EpisodeFormProps {
  initialData: EpisodeWithRelations | null;
  movie: Movie;
  isNew: boolean;
  isEditing: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const EpisodeForm: React.FC<EpisodeFormProps> = ({
  initialData,
  movie,
  isNew,
  isEditing,
  onCancel,
  onSuccess
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const action = isNew ? "Create" : "Save changes";

  const defaultValues = isNew ? {
    name: "",
    slug: "",
  } : {
    name: initialData!.name,
    slug: initialData!.slug,
  };

  const form = useForm<EpisodeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: EpisodeFormValues) => {
    try {
      setIsLoading(true);
  
      const url = isNew 
        ? `/api/movies/episodes/${movie.id}` 
        : `/api/movies/episodes/${movie.id}/${initialData!.id}`;
  
      const axiosConfig = {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      };
  
      const { data: responseData } = isNew 
        ? await axios.post(url, data, axiosConfig)
        : await axios.patch(url, data, axiosConfig);
  
      toast.success(isNew ? 'Episode created successfully!' : 'Episode updated successfully!');
  
      if (isNew) {
        router.push(`/movies/${movie.id}/${responseData.id}`);
      } else {
        onSuccess();
      }
  
      router.refresh();
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

  return (
    <Form {...form}>
      <form id="episode-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Film size={18} className="text-muted-foreground" />
            Episode Information
          </h3>

          {isEditing && (
            <div className="flex justify-end gap-2">
              {!isNew && (
                <Button
                  type="button"
                  onClick={onCancel}
                  variant="outline"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="gap-1"
              >
                <Save size={16} />
                {isLoading ? "Saving..." : action}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Episode Name</FormLabel>
                <FormControl>
                  <Input 
                    disabled={isLoading || !isEditing} 
                    placeholder="Enter episode name (e.g. Episode 1)" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Slug</FormLabel>
                <FormControl>
                  <Input 
                    disabled={isLoading || !isEditing} 
                    placeholder="episode-1" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!isNew && !isEditing && initialData && (
          <div className="space-y-4 pt-4">
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                <p>
                  {format(new Date(initialData.createdAt), "MMMM do, yyyy")}
                </p>
              </div>
              {initialData.servers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Available Servers</h4>
                  <p>{initialData.servers.length}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </Form>
  );
};

export default EpisodeForm;