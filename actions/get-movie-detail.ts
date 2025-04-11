"use server";

import axios from "axios";
import { KKApiSingleMovieResponse, KKApiMovie } from "@/types/kkapi";

/**
 * Fetches detailed information for a specific movie from the KKPhim API
 * @param slug The movie's slug identifier
 * @param signal Optional AbortSignal for cancellation
 * @returns Detailed movie information or error
 */
export async function getMovieDetail(
    slug: string,
    signal?: AbortSignal
): Promise<{
    movie?: KKApiMovie;
    error?: string;
}> {
    try {
        if (!slug || typeof slug !== 'string') {
            throw new Error("Invalid movie slug");
        }

        const sanitizedSlug = encodeURIComponent(slug.trim());

        const response = await axios.get<KKApiSingleMovieResponse>(
            `https://phimapi.com/phim/${sanitizedSlug}`,
            { signal } // 👈 support for aborting
        );

        if (!response.data.movie) {
            return { error: "Movie not found" };
        }

        return {
            movie: response.data.movie
        };
    } catch (error: unknown) {
        if (axios.isCancel(error)) {
            console.warn(`Request for "${slug}" was canceled.`);
            return { error: "Request was cancelled" };
        }

        console.error(`Failed to fetch movie details for slug "${slug}":`, error);

        return {
            error: error instanceof Error ? error.message : "Failed to fetch movie details"
        };
    }
}
