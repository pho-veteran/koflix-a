/**
 * Types for KKPhim API responses
 * Base URL: https://phimapi.com/
 */

export interface KKApiPagination {
    totalItems: number;
    totalItemsPerPage: number;
    currentPage: number;
    totalPages: number;
    updateToday: number;
}

export interface KKApiCategory {
    id: string;
    name: string;
    slug: string;
}

export interface KKApiCountry {
    id: string;
    name: string;
    slug: string;
}

export interface KKApiEpisode {
    id: string;
    name: string;
    slug: string;
    filename: string;
    link_embed: string;
    link_m3u8: string;
}

export interface KKApiTmdb {
    type: string;
    id: string;
    season: number;
    vote_average: number;
    vote_count: number;
}

// Base movie type with required fields that appear in both list and detail views
export interface KKApiMovieBase {
    _id: string;
    name: string;
    slug: string;
    origin_name: string;
    type: string;
    poster_url: string;
    thumb_url: string;
    sub_docquyen: boolean;
    episode_current: string;
    time: string;
    quality: string;
    lang: string;
    year: number;
    category: KKApiCategory[];
    country: KKApiCountry[];
}

// Detailed movie type with additional fields for full movie details
export interface KKApiMovie extends KKApiMovieBase {
    tmdb: KKApiTmdb;
    imdb: {
        id: string;
    }
    created: string;
    modified: string;
    content: string;
    status: string;
    is_copyright: boolean;
    chieurap: boolean;
    trailer_url?: string;
    episode_total: string;
    notify: string;
    showtimes: string;
    view: number;
    actor: string[];
    director: string[];
    episodes: {
        server_name: string;
        server_data: KKApiEpisode[];
    }[];
}

/**
 * Type for multiple movie list responses
 * Endpoint: https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page={number}
 */
export interface KKApiMoviesResponse {
    status: boolean;
    items: KKApiMovieBase[];
    pagination: KKApiPagination;
}

/**
 * Type for single movie lookup by slug
 * Endpoint: https://phimapi.com/phim/{slug}
 */
export interface KKApiSingleMovieResponse {
    status: boolean;
    movie: KKApiMovie[];
}
