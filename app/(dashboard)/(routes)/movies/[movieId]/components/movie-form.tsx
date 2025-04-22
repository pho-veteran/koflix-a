"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Movie, MovieType, Genre, Country, Episode, EpisodeServer } from "@prisma/client";
import {
  Clock, Film, Calendar, Star, Award, Globe, Layers,
  Youtube, Languages, Tag, Play, Edit, Save, ArrowLeft, Trash
} from "lucide-react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import ImageUpload from "@/components/ui/image-upload";
import { EpisodeSelectorModal } from "./episode-selector-modal";

// Use Prisma types directly instead of redefining them
type MovieWithRelations = Movie & {
  type?: MovieType;
  genres?: Genre[];
  countries?: Country[];
  episodes?: (Episode & {
    servers: EpisodeServer[];
  })[];
};

// Define form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  origin_name: z.string().min(1, "Original name is required"),
  typeId: z.string().min(1, "Movie type is required"),
  genreIds: z.array(z.string()).min(1, "At least one genre is required"),
  countryIds: z.array(z.string()).min(1, "At least one country is required"),
  year: z.coerce.number().int().min(1900, "Year must be 1900 or later").max(new Date().getFullYear() + 5),
  time: z.string().min(1, "Duration is required"),
  poster_url: z.string().min(1, "Poster image is required"),
  thumb_url: z.string().min(1, "Thumbnail image is required"),
  trailer_url: z.string().optional(),
  quality: z.string().optional(),
  lang: z.string().optional(),
  episode_current: z.string().optional(),
  episode_total: z.string().optional(),
  status: z.string().optional(),
  content: z.string().min(1, "Content description is required"),
  actor: z.array(z.string()).optional(),
  director: z.array(z.string()).optional(),
  sub_docquyen: z.boolean().default(false),
  is_copyright: z.boolean().default(false),
  chieurap: z.boolean().default(false),
});

type MovieFormValues = z.infer<typeof formSchema>;

interface MovieFormProps {
  initialData: MovieWithRelations | null;
  movieTypes: MovieType[];
  genres: Genre[];
  countries: Country[];
  isNew: boolean;
}

const MovieForm: React.FC<MovieFormProps> = ({
  initialData,
  movieTypes,
  genres,
  countries,
  isNew
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(isNew);
  const [isMounted, setIsMounted] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [episodeModalOpen, setEpisodeModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const action = isNew ? "Create" : "Save changes";

  const defaultValues = isNew ? {
    name: "",
    slug: "",
    origin_name: "",
    typeId: "",
    genreIds: [],
    countryIds: [],
    year: new Date().getFullYear(),
    time: "",
    poster_url: "",
    thumb_url: "",
    trailer_url: "",
    quality: "",
    lang: "",
    episode_current: "",
    episode_total: "",
    status: "",
    content: "",
    actor: [],
    director: [],
    sub_docquyen: false,
    is_copyright: false,
    chieurap: false,
  } : {
    name: initialData!.name,
    slug: initialData!.slug,
    origin_name: initialData!.origin_name,
    typeId: initialData!.typeId,
    genreIds: initialData!.genres?.map((genre: Genre) => genre.id) || [],
    countryIds: initialData!.countries?.map((country: Country) => country.id) || [],
    year: initialData!.year,
    time: initialData!.time,
    poster_url: initialData!.poster_url,
    thumb_url: initialData!.thumb_url,
    trailer_url: initialData!.trailer_url || "",
    quality: initialData!.quality || "",
    lang: initialData!.lang || "",
    episode_current: initialData!.episode_current || "",
    episode_total: initialData!.episode_total || "",
    status: initialData!.status || "",
    content: initialData!.content,
    actor: initialData!.actor || [],
    director: initialData!.director || [],
    sub_docquyen: initialData!.sub_docquyen,
    is_copyright: initialData!.is_copyright,
    chieurap: initialData!.chieurap,
  };

  const form = useForm<MovieFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: MovieFormValues) => {
    try {
      setIsLoading(true);
  
      const url = isNew ? '/api/movies' : `/api/movies/${initialData!.id}`;
  
      // Use axios with a timeout to prevent hanging
      const axiosConfig = {
        timeout: 10000, // 10 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      };
  
      // Make the request and use the response
      const { data: responseData } = isNew 
        ? await axios.post(url, data, axiosConfig)
        : await axios.patch(url, data, axiosConfig);
  
      toast.success(isNew ? 'Movie created successfully!' : 'Movie updated successfully!');
  
      if (isNew) {
        // Navigate to the newly created movie's page
        router.push(`/movies/${responseData.id}`);
      } else {
        setEditMode(false);
      }
  
      router.refresh();
    } catch (error) {
      // More detailed error handling with axios
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

  const handleDelete = async () => {
    try {
      setIsLoading(true);

      // Use axios with a timeout to prevent hanging
      const axiosConfig = {
        timeout: 10000, // 10 seconds timeout
      };

      await axios.delete(`/api/movies/${initialData!.id}`, axiosConfig);

      toast.success('Movie deleted successfully!');
      router.push('/movies');
      router.refresh();
    } catch (error) {
      // Error handling with axios
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          toast.error('Request timed out. Please try again.');
        } else if (error.response) {
          const errorMsg = error.response.data?.error || 'Failed to delete movie';
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
      setDeleteModalOpen(false);
    }
  };

  // Find names based on ids
  const getMovieTypeName = (id: string) => {
    const type = movieTypes.find(t => t.id === id);
    return type?.name || "";
  };

  const getGenreNames = (ids: string[]) => {
    return ids.map(id => {
      const genre = genres.find(g => g.id === id);
      return genre?.name || "";
    });
  };

  const getCountryNames = (ids: string[]) => {
    return ids.map(id => {
      const country = countries.find(c => c.id === id);
      return country?.name || "";
    });
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="pb-10">
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Movie</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this movie? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
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
          onClick={() => router.push('/movies')}
          className="gap-1"
        >
          <ArrowLeft size={16} />
          Back to movies
        </Button>

        {!isNew && !editMode && (
          <div className="flex gap-2">
            <Button
              onClick={() => setEpisodeModalOpen(true)}
              variant="outline"
              className="gap-1.5"
            >
              <Layers className="h-4 w-4" />
              Manage Episodes
            </Button>
            <Button
              onClick={() => setEditMode(true)}
              variant="outline"
              className="gap-1"
            >
              <Edit size={16} />
              Edit Movie
            </Button>
            <Button
              onClick={() => setDeleteModalOpen(true)}
              variant="destructive"
              className="gap-1"
            >
              <Trash size={16} />
              Delete Movie
            </Button>
          </div>
        )}

        {editMode && (
          <div className="flex justify-end gap-2">
            {!isNew && (
              <Button
                type="button"
                onClick={() => setEditMode(false)}
                variant="outline"
                className="gap-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              form="movie-form"
              disabled={isLoading}
              className="gap-1"
            >
              <Save size={16} />
              {isLoading ? "Saving..." : action}
            </Button>
          </div>
        )}
      </div>

      <Form {...form}>
        <form id="movie-form" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Thumbnail Banner - Full width at the top */}
          <Card className="w-full mb-6 py-0">
            <CardContent className="p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Film size={18} className="text-muted-foreground" />
                  {editMode ? "Thumbnail Image" : "Movie Banner"}
                </h3>

                <FormField
                  control={form.control}
                  name="thumb_url"
                  render={({ field }) => (
                    <FormItem>
                      {editMode ? (
                        <FormControl>
                          <div className="h-[320px] w-full">
                            <ImageUpload
                              disabled={isLoading}
                              onChange={(url) => field.onChange(url)}
                              onRemove={() => field.onChange("")}
                              value={field.value ? [field.value] : []}
                              aspectRatio="landscape"
                              height="320px"
                              buttonText="Upload Banner"
                              imageClassName="object-cover object-center"
                            />
                          </div>
                        </FormControl>
                      ) : field.value && (
                        <div className="relative w-full h-[320px] rounded-md overflow-hidden bg-muted/20">
                          <Image
                            fill
                            src={field.value}
                            alt="Thumbnail"
                            className="object-cover"
                            priority
                          />
                        </div>
                      )}
                      {editMode && <FormMessage />}
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Main movie layout with poster and details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Poster */}
            <Card className="lg:col-span-1 overflow-hidden flex flex-col py-0">
              <CardContent className="p-0 space-y-4 flex-1 flex flex-col">
                <div className="relative w-full aspect-[2/3] bg-muted/20">
                  <FormField
                    control={form.control}
                    name="poster_url"
                    render={({ field }) => (
                      <FormItem className="h-full">
                        {editMode ? (
                          <FormControl>
                            <div className="absolute inset-0">
                              <ImageUpload
                                disabled={isLoading}
                                onChange={(url) => field.onChange(url)}
                                onRemove={() => field.onChange("")}
                                value={field.value ? [field.value] : []}
                                aspectRatio="portrait"
                                height="100%"
                                buttonText="Upload Poster"
                                variant="compact"
                              />
                            </div>
                          </FormControl>
                        ) : field.value && (
                          <div className="h-full w-full relative">
                            <Image
                              fill
                              src={field.value}
                              alt="Poster"
                              className="object-cover"
                              priority
                            />
                          </div>
                        )}
                        {editMode && <FormMessage />}
                      </FormItem>
                    )}
                  />
                </div>

                {!editMode && (
                  <div className="p-4 space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-muted-foreground" />
                        <span>{initialData?.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-muted-foreground" />
                        <span>{initialData?.year}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-muted-foreground" />
                        <span>{initialData?.quality}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Languages size={16} className="text-muted-foreground" />
                        <span>{initialData?.lang}</span>
                      </div>
                      {initialData?.type && (
                        <div className="flex items-center gap-2">
                          <Film size={16} className="text-muted-foreground" />
                          <span>{initialData.type.name}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {initialData?.episode_current && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Episodes</div>
                        <div className="flex items-center gap-2">
                          <Play size={14} />
                          <span>Current: {initialData.episode_current}</span>
                        </div>
                        {initialData.episode_total && (
                          <div className="flex items-center gap-2">
                            <Layers size={14} />
                            <span>Total: {initialData.episode_total}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {(initialData?.sub_docquyen || initialData?.is_copyright || initialData?.chieurap) && (
                      <>
                        <Separator />
                        <div className="flex flex-wrap gap-2">
                          {initialData.sub_docquyen && (
                            <Badge variant="outline">Exclusive Subtitle</Badge>
                          )}
                          {initialData.is_copyright && (
                            <Badge variant="outline">Copyright Protected</Badge>
                          )}
                          {initialData.chieurap && (
                            <Badge variant="outline">Theatrical Release</Badge>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right column - Details */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6 space-y-6">
                {/* Title and basic info section */}
                <div className="space-y-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          {editMode ? (
                            <>
                              <FormLabel>Movie Title</FormLabel>
                              <FormControl>
                                <Input
                                  disabled={isLoading}
                                  placeholder="Movie name"
                                  {...field}
                                  className="text-xl font-bold"
                                />
                              </FormControl>
                              <FormMessage />
                            </>
                          ) : (
                            <h1 className="text-3xl font-bold">{field.value}</h1>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="origin_name"
                      render={({ field }) => (
                        <FormItem>
                          {editMode ? (
                            <>
                              <FormLabel className="mt-2">Original Title</FormLabel>
                              <FormControl>
                                <Input
                                  disabled={isLoading}
                                  placeholder="Original title"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </>
                          ) : (
                            <h2 className="text-lg text-muted-foreground">{field.value}</h2>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>

                  {editMode && (
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Slug</FormLabel>
                          <FormControl>
                            <Input disabled={isLoading} placeholder="movie-slug" {...field} />
                          </FormControl>
                          <FormDescription>
                            URL-friendly version of the name
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          {editMode ? (
                            <>
                              <FormLabel>Release Year</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  disabled={isLoading}
                                  placeholder="2025"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </>
                          ) : null}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          {editMode ? (
                            <>
                              <FormLabel>Duration</FormLabel>
                              <FormControl>
                                <Input disabled={isLoading} placeholder="120 min" {...field} />
                              </FormControl>
                              <FormMessage />
                            </>
                          ) : null}
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Classification section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Tag size={18} className="text-muted-foreground" />
                    Classification
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="typeId"
                      render={({ field }) => (
                        <FormItem>
                          {editMode ? (
                            <>
                              <FormLabel>Movie Type</FormLabel>
                              <Select
                                disabled={isLoading}
                                onValueChange={field.onChange}
                                value={field.value}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a movie type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {movieTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </>
                          ) : (
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Movie Type</div>
                              <div className="font-medium">{getMovieTypeName(field.value)}</div>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          {editMode ? (
                            <>
                              <FormLabel>Status</FormLabel>
                              <Select
                                disabled={isLoading}
                                onValueChange={field.onChange}
                                value={field.value || ""}
                                defaultValue={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="ongoing">Ongoing</SelectItem>
                                  <SelectItem value="upcoming">Upcoming</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </>
                          ) : field.value ? (
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Status</div>
                              <div className="font-medium capitalize">{field.value}</div>
                            </div>
                          ) : null}
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="genreIds"
                      render={({ field }) => (
                        <FormItem>
                          {editMode ? (
                            <>
                              <FormLabel>Genres</FormLabel>
                              <FormDescription>
                                Select all applicable genres for this movie
                              </FormDescription>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {genres.map((genre) => (
                                  <div key={genre.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={field.value?.includes(genre.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...field.value, genre.id]);
                                        } else {
                                          field.onChange(field.value.filter((id) => id !== genre.id));
                                        }
                                      }}
                                      id={`genre-${genre.id}`}
                                      disabled={isLoading}
                                    />
                                    <label
                                      htmlFor={`genre-${genre.id}`}
                                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {genre.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Genres</div>
                              <div className="flex flex-wrap gap-2">
                                {getGenreNames(field.value).map((name, index) => (
                                  <Badge key={index} variant="secondary">{name}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="countryIds"
                      render={({ field }) => (
                        <FormItem>
                          {editMode ? (
                            <>
                              <FormLabel>Countries</FormLabel>
                              <FormDescription>
                                Select all applicable countries for this movie
                              </FormDescription>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {countries.map((country) => (
                                  <div key={country.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={field.value?.includes(country.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...field.value, country.id]);
                                        } else {
                                          field.onChange(field.value.filter((id) => id !== country.id));
                                        }
                                      }}
                                      id={`country-${country.id}`}
                                      disabled={isLoading}
                                    />
                                    <label
                                      htmlFor={`country-${country.id}`}
                                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {country.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Countries</div>
                              <div className="flex flex-wrap gap-2">
                                {getCountryNames(field.value).map((name, index) => (
                                  <Badge key={index} variant="outline">{name}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Additional details */}
                {editMode && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Star size={18} className="text-muted-foreground" />
                      Media Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quality</FormLabel>
                            <FormControl>
                              <Input disabled={isLoading} placeholder="HD, 4K..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lang"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language</FormLabel>
                            <FormControl>
                              <Input disabled={isLoading} placeholder="Vietsub, Thuyết minh..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="episode_current"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Episode</FormLabel>
                            <FormControl>
                              <Input disabled={isLoading} placeholder="10" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="episode_total"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Episodes</FormLabel>
                            <FormControl>
                              <Input disabled={isLoading} placeholder="16" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="trailer_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trailer URL</FormLabel>
                          <FormControl>
                            <Input disabled={isLoading} placeholder="https://youtube.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="sub_docquyen"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Exclusive Subtitle</FormLabel>
                              <FormDescription>
                                This movie has exclusive subtitles
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="is_copyright"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Has Copyright</FormLabel>
                              <FormDescription>
                                This movie has copyright protection
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="chieurap"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Theatrical Release</FormLabel>
                              <FormDescription>
                                This movie is showing in theaters
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                <Separator />

                {/* Trailer section - only shown in view mode */}
                {!editMode && initialData?.trailer_url && (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Youtube size={18} className="text-muted-foreground" />
                        Trailer
                      </h3>

                      <div className="relative w-full aspect-video bg-muted/30 rounded-md overflow-hidden">
                        <iframe
                          src={initialData.trailer_url.replace('watch?v=', 'embed/')}
                          className="absolute inset-0 w-full h-full"
                          title="Movie Trailer"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>

                    <Separator />
                  </>
                )}

                {/* Description */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Award size={18} className="text-muted-foreground" />
                    Overview
                  </h3>

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        {editMode ? (
                          <>
                            <FormLabel>Movie Description</FormLabel>
                            <FormControl>
                              <Textarea
                                disabled={isLoading}
                                placeholder="Enter movie plot, description and details"
                                className="min-h-[200px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p>{field.value}</p>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Cast and Crew */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Globe size={18} className="text-muted-foreground" />
                    Cast and Crew
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="actor"
                      render={({ field }) => (
                        <FormItem>
                          {editMode ? (
                            <>
                              <FormLabel>Actors</FormLabel>
                              <FormControl>
                                <Input
                                  disabled={isLoading}
                                  placeholder="Enter actor names separated by commas"
                                  value={field.value?.join(", ") || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(
                                      value.split(",").map(item => item.trim()).filter(Boolean)
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Enter multiple actor names separated by commas
                              </FormDescription>
                              <FormMessage />
                            </>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Actors</div>
                              <div className="flex flex-wrap gap-1">
                                {field.value && field.value.length > 0 ? (
                                  field.value.map((actor, index) => (
                                    <Badge key={index} variant="outline" className="capitalize">
                                      {actor}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-sm">No actors listed</span>
                                )}
                              </div>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="director"
                      render={({ field }) => (
                        <FormItem>
                          {editMode ? (
                            <>
                              <FormLabel>Directors</FormLabel>
                              <FormControl>
                                <Input
                                  disabled={isLoading}
                                  placeholder="Enter director names separated by commas"
                                  value={field.value?.join(", ") || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(
                                      value.split(",").map(item => item.trim()).filter(Boolean)
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Enter multiple director names separated by commas
                              </FormDescription>
                              <FormMessage />
                            </>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Directors</div>
                              <div className="flex flex-wrap gap-1">
                                {field.value && field.value.length > 0 ? (
                                  field.value.map((director, index) => (
                                    <Badge key={index} variant="secondary" className="capitalize">
                                      {director}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-sm">No directors listed</span>
                                )}
                              </div>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>

      {/* Episode Selector Modal */}
      {!isNew && initialData?.id && (
        <EpisodeSelectorModal
          isOpen={episodeModalOpen}
          onClose={() => setEpisodeModalOpen(false)}
          movieId={initialData.id}
          movieName={initialData.name}
        />
      )}
    </div>
  );
};

export default MovieForm;