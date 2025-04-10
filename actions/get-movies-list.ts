"use server";

import axios from "axios";
import { KKApiMoviesResponse, KKApiMovieBase } from "@/types/kkapi";

/**
 * Fetches a list of movies from the KKPhim API
 * @param page Page number to fetch
 * @returns Movies and pagination info
 */
export async function getMoviesList(page: number = 1): Promise<{
    movies: KKApiMovieBase[];
    pagination: KKApiMoviesResponse["pagination"];
    error?: string;
}> {
    try {
        // Ensure page is always a positive integer
        const validPage = Math.max(1, Math.floor(page));

        // Simple API request with just page parameter
        const response = await axios.get<KKApiMoviesResponse>(
            `https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=${validPage}`
        );

        // Return the movies and pagination directly from the response
        return {
            movies: response.data.items,
            pagination: response.data.pagination,
        };
    } catch (error) {
        console.error("Failed to fetch movies:", error);

        // Return empty results with error
        return {
            movies: [],
            pagination: {
                totalItems: 0,
                totalItemsPerPage: 24,
                currentPage: page,
                totalPages: 1,
                updateToday: 0,
            },
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch movies",
        };
    }
}
