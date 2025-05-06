import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Define a generic type for the document structure expected from vector search
// Adjust properties as needed for different collections/use cases
type VectorSearchDocument = Prisma.JsonObject & {
    _id: { $oid: string } | string;
    name: string;
    slug: string;
    poster_url: string;
    thumb_url: string;
    year: number;
    score: number;
};

interface MongoVectorSearchResult {
    cursor: {
        firstBatch: VectorSearchDocument[];
    };
    ok: number;
}

interface FormattedSearchResult {
    id: string;
    name: string;
    slug: string;
    poster_url: string;
    thumb_url: string;
    year: number;
    score: number;
}

interface VectorSearchParams {
    collection: string;
    index: string;
    path: string;
    queryVector: number[];
    numCandidates: number;
    limit: number;
    filter?: Prisma.JsonObject;
    project?: Prisma.JsonObject;
}

/**
 * Performs a MongoDB Atlas Vector Search using Prisma's $runCommandRaw.
 *
 * @param params - Parameters for the vector search query.
 * @returns A promise resolving to an array of formatted search results.
 * @throws Throws an error if the search fails or returns unexpected results.
 */
export async function performVectorSearch(params: VectorSearchParams): Promise<FormattedSearchResult[]> {
    const {
        collection,
        index,
        path,
        queryVector,
        numCandidates,
        limit,
        filter,
        project = {
            "_id": 1,
            "name": 1,
            "slug": 1,
            "poster_url": 1,
            "thumb_url": 1,
            "year": 1,
            "score": { "$meta": "vectorSearchScore" }
        }
    } = params;

    // Construct the pipeline
    const pipeline: Prisma.JsonObject[] = [
        {
            "$vectorSearch": {
                index,
                path,
                queryVector,
                numCandidates,
                limit: filter ? (limit * 3) + 1 : limit * 3, // Adjust limit for filtering
            }
        }
    ];

    if (filter) {
        pipeline.push({ "$match": filter });
    }

    pipeline.push({ "$project": project });

    pipeline.push({ "$limit": limit });

    try {
        const rawResult = await prisma.$runCommandRaw({
            aggregate: collection,
            pipeline: pipeline,
            cursor: {}
        });

        const result = rawResult as unknown as MongoVectorSearchResult;

        if (result &&
            typeof result === 'object' &&
            result.cursor &&
            typeof result.cursor === 'object' &&
            Array.isArray(result.cursor.firstBatch)) {

            const searchResults = result.cursor.firstBatch
                .filter((doc): doc is VectorSearchDocument => doc !== null && typeof doc === 'object')
                .map((doc) => ({
                    id: typeof doc._id === 'object' && doc._id !== null && '$oid' in doc._id ? doc._id.$oid : String(doc._id),
                    name: doc.name,
                    slug: doc.slug,
                    poster_url: doc.poster_url,
                    thumb_url: doc.thumb_url,
                    year: doc.year,
                    score: doc.score
                }));

            return searchResults;
        } else {
            console.warn("Vector search returned unexpected result structure:", result);
            return [];
        }

    } catch (error) {
        console.error(`Vector search failed for collection "${collection}", index "${index}":`, error);
        throw error;
    }
}