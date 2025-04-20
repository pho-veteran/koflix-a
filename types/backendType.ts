export type MovieFrontEndResult = {
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

export interface MovieResult {
    id: string;
    name: string;
    origin_name: string;
    slug: string;
    poster_url: string;
    year: number;
    
    type?: string;
    typeSlug?: string;
    
    genres: string[];
    genreSlugs?: string[];
    
    episodeCurrent?: string | null;
    episodeTotal?: string | null;
    
    rating: number;
    views: number;
    likes: number;
    
    updatedAt: string;
    createdAt: string;
}