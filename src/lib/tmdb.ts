// Server-only TMDb API client utilities for Next.js
// - Uses axios for HTTP
// - Uses zod to validate responses (fail-fast on API changes)
// - Reads TMDB_ACCESS_TOKEN (v4) or TMDB_API_KEY (v3) from environment
//
// Usage (server only):
// import { searchMovies, getMovieDetails } from "@/lib/tmdb";
// const { results } = await searchMovies({ query: "Inception" });
// const movie = await getMovieDetails(27205);

import "server-only";
import axios, { AxiosError, AxiosInstance } from "axios";
import { z } from "zod";

// Base URLs and image helpers from TMDb
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// Image sizes: https://developer.themoviedb.org/reference/configuration-details
export type ImageSize =
  | "original"
  | "w92"
  | "w154"
  | "w185"
  | "w342"
  | "w500"
  | "w780"
  | "h632";

export function getImageUrl(
  path: string | null | undefined,
  size: ImageSize = "w500"
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getPosterUrl(
  path: string | null | undefined,
  size: ImageSize = "w342"
): string | null {
  return getImageUrl(path, size);
}

export function getBackdropUrl(
  path: string | null | undefined,
  size: ImageSize = "w780"
): string | null {
  return getImageUrl(path, size);
}

// Common zod schemas (subset of fields we typically use)
const MovieSummarySchema = z.object({
  id: z.number(),
  title: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? ""),
  original_title: z.string().optional().default(""),
  overview: z.string().optional().default(""),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  release_date: z.string().optional().default(""),
  vote_average: z.number().optional().default(0),
  vote_count: z.number().optional().default(0),
  genre_ids: z.array(z.number()).optional().default([]),
  popularity: z.number().optional().default(0),
  adult: z.boolean().optional().default(false),
  original_language: z.string().optional().default(""),
});

const GenreSchema = z.object({ id: z.number(), name: z.string() });

const MovieDetailSchema = MovieSummarySchema.extend({
  runtime: z.number().nullable().optional(),
  status: z.string().optional().default(""),
});

const PaginatedMoviesSchema = z.object({
  page: z.number(),
  results: z.array(MovieSummarySchema),
  total_pages: z.number(),
  total_results: z.number(),
});

const CreditsSchema = z.object({
  id: z.number().optional(),
  cast: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        character: z.string().optional().default(""),
        profile_path: z.string().nullable().optional(),
        order: z.number().optional().default(0),
      })
    )
    .default([]),
  crew: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        department: z.string().optional().default(""),
        job: z.string().optional().default(""),
      })
    )
    .default([]),
});

export type MovieSummary = z.infer<typeof MovieSummarySchema>;
export type MovieDetail = z.infer<typeof MovieDetailSchema>;
export type Credits = z.infer<typeof CreditsSchema>;
// (Reviews & recommendations removed for simplified integration)

// Axios client with auth via env
function createClient(): AxiosInstance {
  const token = process.env.TMDB_ACCESS_TOKEN; // TMDb v4 token (recommended)
  const apiKey = process.env.TMDB_API_KEY; // TMDb v3 API key (fallback)

  if (!token && !apiKey) {
    throw new Error(
      "TMDB credentials missing. Set TMDB_ACCESS_TOKEN (preferred) or TMDB_API_KEY in your environment."
    );
  }

  const instance = axios.create({
    baseURL: TMDB_BASE_URL,
    timeout: 10000,
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate, br",
    },
    // Note: params set per-request; we attach api_key in request interceptor if needed
  });

  instance.interceptors.request.use((config) => {
    // Language and region hints can be passed via params on each call.
    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      } as any;
    } else if (apiKey) {
      config.params = { ...(config.params || {}), api_key: apiKey };
    }
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
      const status = err.response?.status;
      const data: any = err.response?.data;
      const message =
        (data && (data.status_message || data.message)) ||
        err.message ||
        "TMDb request failed";
      const code = (data && data.status_code) || status;
      const details = {
        status,
        code,
        url: err.config?.url,
        method: err.config?.method,
      };
      const wrapped = new Error(`${message}${code ? ` (code ${code})` : ""}`);
      (wrapped as any).details = details;
      throw wrapped;
    }
  );

  return instance;
}

const client = createClient();

// Shared options for locale/region and paging
type LocaleOpts = {
  language?: string; // e.g., 'en-US'
  region?: string; // e.g., 'US'
};

type PageOpts = { page?: number } & LocaleOpts;

// Search movies by query
export async function searchMovies(options: {
  query: string;
  page?: number;
  include_adult?: boolean;
  year?: number;
  language?: string;
  region?: string;
}): Promise<z.infer<typeof PaginatedMoviesSchema>> {
  const { data } = await client.get("/search/movie", {
    params: {
      query: options.query,
      page: options.page ?? 1,
      include_adult: options.include_adult ?? false,
      year: options.year,
      language: options.language,
      region: options.region,
    },
  });
  return PaginatedMoviesSchema.parse(data);
}

// Movie details
export async function getMovieDetails(
  movieId: number,
  opts: LocaleOpts & { append_to_response?: string } = {}
): Promise<MovieDetail> {
  const { data } = await client.get(`/movie/${movieId}`, {
    params: { ...opts },
  });
  return MovieDetailSchema.parse(data);
}

// Genres
export const GenresListSchema = z.object({ genres: z.array(GenreSchema) });
export type GenresList = z.infer<typeof GenresListSchema>;

// Minimal adapter to a simpler movie card interface
export type MovieCard = {
  id: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string;
  rating: number;
};

export function toMovieCard(m: MovieSummary): MovieCard {
  return {
    id: m.id,
    title: m.title || m.original_title || "",
    overview: m.overview || "",
    posterUrl: getPosterUrl(m.poster_path, "w342"),
    backdropUrl: getBackdropUrl(m.backdrop_path, "w780"),
    releaseDate: m.release_date || "",
    rating: m.vote_average ?? 0,
  };
}

// Lightweight health check for env wiring (optional)
export async function pingTmdb(): Promise<boolean> {
  try {
    await client.get("/configuration");
    return true;
  } catch {
    return false;
  }
}

// Helpful error guard for server components/routes
export function assertTmdbEnv(): void {
  if (!process.env.TMDB_ACCESS_TOKEN && !process.env.TMDB_API_KEY) {
    throw new Error(
      "TMDB credentials missing. Set TMDB_ACCESS_TOKEN (preferred) or TMDB_API_KEY in your environment."
    );
  }
}
