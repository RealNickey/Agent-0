/**
 * TMDb Movie Tool for AI SDK Integration
 * Provides movie search, details, and review functionality
 */

import React, { useEffect, useMemo, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import {
  FunctionDeclaration,
  LiveServerToolCall,
  Modality,
  Type,
} from "@google/genai";

// Tool declarations for movie-related functions
const movieSearchDeclaration: FunctionDeclaration = {
  name: "search_movies",
  description: "Search for movies by title or keywords using TMDb API",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "The movie title or search query",
      },
      page: {
        type: Type.NUMBER,
        description: "Page number for pagination (default: 1)",
        default: 1,
      },
      year: {
        type: Type.NUMBER,
        description: "Optional year to filter results",
      },
    },
    required: ["query"],
  },
};

const movieDetailsDeclaration: FunctionDeclaration = {
  name: "get_movie_details",
  description: "Get detailed information about a specific movie including cast, crew, and reviews",
  parameters: {
    type: Type.OBJECT,
    properties: {
      movie_id: {
        type: Type.NUMBER,
        description: "The TMDb movie ID",
      },
      include_reviews: {
        type: Type.BOOLEAN,
        description: "Whether to include movie reviews (default: true)",
        default: true,
      },
    },
    required: ["movie_id"],
  },
};

const popularMoviesDeclaration: FunctionDeclaration = {
  name: "get_popular_movies",
  description: "Get currently popular movies",
  parameters: {
    type: Type.OBJECT,
    properties: {
      page: {
        type: Type.NUMBER,
        description: "Page number for pagination (default: 1)",
        default: 1,
      },
    },
  },
};

const topRatedMoviesDeclaration: FunctionDeclaration = {
  name: "get_top_rated_movies",
  description: "Get top-rated movies of all time",
  parameters: {
    type: Type.OBJECT,
    properties: {
      page: {
        type: Type.NUMBER,
        description: "Page number for pagination (default: 1)",
        default: 1,
      },
    },
  },
};

const movieRecommendationsDeclaration: FunctionDeclaration = {
  name: "get_movie_recommendations",
  description: "Get movie recommendations based on a specific movie",
  parameters: {
    type: Type.OBJECT,
    properties: {
      movie_id: {
        type: Type.NUMBER,
        description: "The TMDb movie ID to base recommendations on",
      },
      page: {
        type: Type.NUMBER,
        description: "Page number for pagination (default: 1)",
        default: 1,
      },
    },
    required: ["movie_id"],
  },
};

// Tool response interface
interface MovieToolResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Helper function to make API calls to our Next.js routes
async function makeAPICall(endpoint: string, params: Record<string, any> = {}): Promise<MovieToolResponse> {
  try {
    const url = new URL(endpoint, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Integrate shared MovieCard UI for rendering results
import { MovieCard as SharedMovieCard } from "../../components/movie-card";

// Adapter: shape from API to shared MovieCard props
type UIMovie = {
  id: number;
  title: string;
  genre: string;
  rating: number;
  duration: string;
  year: number;
  poster: string;
  backdrop: string;
  description: string;
  director: string;
};

function mapToUIMovie(apiMovie: any): UIMovie {
  const year = (apiMovie.releaseDate || apiMovie.release_date || "").split("-")[0] || 0;
  return {
    id: apiMovie.id,
    title: apiMovie.title || "",
    genre: (apiMovie.genres?.[0]?.name as string) || "Movie",
    rating: typeof apiMovie.rating === "number" ? apiMovie.rating : (apiMovie.vote_average ?? 0),
    duration: apiMovie.runtime ? `${apiMovie.runtime} min` : "",
    year: Number(year) || 0,
    poster: apiMovie.posterUrl || (apiMovie.poster_path ? `https://image.tmdb.org/t/p/w342${apiMovie.poster_path}` : ""),
    backdrop: apiMovie.backdropUrl || (apiMovie.backdrop_path ? `https://image.tmdb.org/t/p/w780${apiMovie.backdrop_path}` : ""),
    description: apiMovie.overview || "",
    director: (apiMovie.credits?.crew?.find((c: any) => c.job === "Director")?.name as string) || "",
  };
}

export function TMDbTool() {
  const [displayData, setDisplayData] = useState<{
    movies?: any[];
    movieDetails?: any;
    reviews?: any[];
  }>({});
  const { client, setConfig, setModel } = useLiveAPIContext();

  useEffect(() => {
    setModel("models/gemini-2.0-flash-exp");
  setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
      },
      systemInstruction: {
        parts: [
          {
      text: `You’re a general assistant. Only use the movie tools when the user’s request is clearly about movies or films.

      If the user asks about movies, you can:
      1) search_movies: find movies by title or keywords
      2) get_movie_details: fetch details (optionally reviews) for a movie id
      3) get_popular_movies: list popular films
      4) get_top_rated_movies: list top rated films
      5) get_movie_recommendations: recommend films based on a movie id

      If the request is not movie-related, do not call any movie tools. Keep responses concise.`,
          },
        ],
      },
      tools: [
        { 
          functionDeclarations: [
            movieSearchDeclaration,
            movieDetailsDeclaration,
            popularMoviesDeclaration,
            topRatedMoviesDeclaration,
            movieRecommendationsDeclaration,
          ]
        },
      ],
    });
  }, [setConfig, setModel]);

  useEffect(() => {
    const onToolCall = async (toolCall: LiveServerToolCall) => {
      if (!toolCall.functionCalls) {
        return;
      }

      const responses: Array<{
        response: { output: MovieToolResponse };
        id: string;
        name: string;
      }> = [];

      for (const fc of toolCall.functionCalls) {
        let result: MovieToolResponse;

        switch (fc.name) {
          case "search_movies":
            const { query, page = 1, year } = fc.args as any;
            result = await makeAPICall("/api/movies/search", { q: query, page, year });
            if (result.success && result.data?.items) {
              setDisplayData({ movies: result.data.items });
            }
            break;

          case "get_movie_details":
            const { movie_id, include_reviews = true } = fc.args as any;
            
            // Get movie details from TMDb directly via our API or use a details endpoint
            const detailsResult = await makeAPICall(`/api/movies/${movie_id}`);
            let reviewsData = null;
            
            if (include_reviews) {
              const reviewsResult = await makeAPICall(`/api/movies/${movie_id}/reviews`);
              if (reviewsResult.success) {
                reviewsData = reviewsResult.data?.results || [];
              }
            }

            if (detailsResult.success) {
              setDisplayData({ 
                movieDetails: detailsResult.data,
                reviews: reviewsData 
              });
              result = {
                success: true,
                data: {
                  movie: detailsResult.data,
                  reviews: reviewsData?.slice(0, 5) // Limit reviews in response
                }
              };
            } else {
              result = detailsResult;
            }
            break;

          case "get_popular_movies":
            const { page: popularPage = 1 } = fc.args as any;
            result = await makeAPICall("/api/movies/popular", { page: popularPage });
            if (result.success && result.data?.items) {
              setDisplayData({ movies: result.data.items });
            }
            break;

          case "get_top_rated_movies":
            const { page: topRatedPage = 1 } = fc.args as any;
            result = await makeAPICall("/api/movies/top-rated", { page: topRatedPage });
            if (result.success && result.data?.items) {
              setDisplayData({ movies: result.data.items });
            }
            break;

          case "get_movie_recommendations":
            const { movie_id: recMovieId, page: recPage = 1 } = fc.args as any;
            result = await makeAPICall(`/api/movies/${recMovieId}/recommendations`, { page: recPage });
            if (result.success && result.data?.items) {
              setDisplayData({ movies: result.data.items });
            }
            break;

          default:
            result = {
              success: false,
              error: `Unknown function: ${fc.name}`,
            };
        }

        responses.push({
          response: { output: result },
          id: fc.id || '',
          name: fc.name || '',
        });
      }

      // Send tool responses back to the AI
      setTimeout(() => {
        client.sendToolResponse({
          functionResponses: responses,
        });
      }, 100);
    };

    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);

  return (
    <div className="tmdb-tool-container h-full w-full">
      <div className="h-full overflow-auto p-4">
        {/* Only render cards when movies are present; no default browser */}
    {Array.isArray(displayData.movies) && displayData.movies.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {displayData.movies.slice(0, 6).map((m: any) => {
              const ui = mapToUIMovie(m);
              return <SharedMovieCard key={ui.id} movie={ui} />;
            })}
          </div>
        )}

        {/* Optional details view if tool returned it */}
        {displayData.movieDetails && (
          <div className="max-w-4xl mx-auto">
            {/* Minimal details rendering; card handles list view visuals */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-2">{displayData.movieDetails.title}</h2>
              <p className="text-gray-300">{displayData.movieDetails.overview}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TMDbTool;
