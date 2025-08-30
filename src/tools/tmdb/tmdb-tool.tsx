/**
 * TMDb Movie Tool for AI SDK Integration
 * Provides movie search, details, and review functionality
 */

import React, { useEffect, useState } from "react";
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

// Movie display component
interface MovieDisplayProps {
  movies?: any[];
  movieDetails?: any;
  reviews?: any[];
}

function MovieDisplay({ movies, movieDetails, reviews }: MovieDisplayProps) {
  if (movieDetails) {
    return (
      <div className="movie-details p-4 bg-gray-800 rounded-lg">
        <div className="flex gap-4">
          {movieDetails.poster_path && (
            <img
              src={`https://image.tmdb.org/t/p/w300${movieDetails.poster_path}`}
              alt={movieDetails.title}
              className="w-48 h-72 object-cover rounded"
            />
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{movieDetails.title}</h2>
            <p className="text-gray-300 mb-2">{movieDetails.overview}</p>
            <div className="text-sm text-gray-400">
              <p><strong>Release Date:</strong> {movieDetails.release_date}</p>
              <p><strong>Rating:</strong> {movieDetails.vote_average}/10</p>
              <p><strong>Runtime:</strong> {movieDetails.runtime} minutes</p>
            </div>
          </div>
        </div>
        {reviews && reviews.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-white mb-2">Recent Reviews</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {reviews.slice(0, 3).map((review, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded text-sm">
                  <div className="font-semibold text-gray-300">
                    {review.author} {review.author_details?.rating && `(${review.author_details.rating}/10)`}
                  </div>
                  <p className="text-gray-400 mt-1 line-clamp-3">
                    {review.content.length > 200 
                      ? review.content.substring(0, 200) + "..." 
                      : review.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (movies && movies.length > 0) {
    return (
      <div className="movies-grid p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {movies.slice(0, 8).map((movie) => (
            <div key={movie.id} className="movie-card bg-gray-800 rounded-lg overflow-hidden">
              {movie.posterUrl && (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-2">
                <h3 className="text-white text-sm font-semibold line-clamp-2">{movie.title}</h3>
                <p className="text-gray-400 text-xs">{movie.releaseDate?.split('-')[0]}</p>
                <p className="text-yellow-400 text-xs">★ {movie.rating.toFixed(1)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
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
            text: `You are a helpful movie assistant with access to TMDb (The Movie Database). You can:
            
            1. Search for movies by title or keywords
            2. Get detailed movie information including cast, crew, and reviews
            3. Provide popular and top-rated movie lists
            4. Give movie recommendations based on other movies
            
            When users ask about movies, use the appropriate tools to help them. You can provide summaries, recommendations, and detailed information about any movie in the database.
            
            Always be enthusiastic about movies and provide helpful, engaging responses about films, actors, directors, and movie recommendations.`,
          },
        ],
      },
      tools: [
        { googleSearch: {} },
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
      <div className="h-full overflow-auto">
        <MovieDisplay {...displayData} />
      </div>
    </div>
  );
}

export default TMDbTool;
