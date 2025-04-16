export type MovieResult = {
    id: string;
    name: string;
    slug: string;
    poster_url: string | null;
    thumb_url: string | null;
    year: number | null;
    genres?: string[];
    score?: number;
    popularityScore?: number;
};