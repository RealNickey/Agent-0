/**
 * Simplified Movie Browser Component
 * Core functionality: search, popular movies, movie details
 */

import React, { useState, useEffect } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import {
  FunctionDeclaration,
  LiveServerToolCall,
  Modality,
  Type,
} from "@google/genai";

// Essential tool declarations
const movieSearchDeclaration: FunctionDeclaration = {
  name: "search_movies",
  description: "Search for movies by title or keywords",
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
    },
    required: ["query"],
  },
};

const movieDetailsDeclaration: FunctionDeclaration = {
  name: "get_movie_details",
  description: "Get detailed information about a specific movie",
  parameters: {
    type: Type.OBJECT,
    properties: {
      movie_id: {
        type: Type.NUMBER,
        description: "The TMDb movie ID",
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

// Types
interface Movie {
  id: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string;
  rating: number;
}

interface MovieDetails extends Movie {
  runtime?: number;
  status?: string;
  vote_count?: number;
}

// Helper function for API calls
async function makeAPICall(endpoint: string, params: Record<string, any> = {}) {
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
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}

// Movie Card Component
function MovieCard({ movie, onSelect, isSelected }: { 
  movie: Movie; 
  onSelect: (movie: Movie) => void;
  isSelected: boolean;
}) {
  return (
    <div 
      className={`movie-card bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => onSelect(movie)}
    >
      {movie.posterUrl && (
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-64 object-cover"
        />
      )}
      <div className="p-3">
        <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">{movie.title}</h3>
        <p className="text-gray-400 text-xs mb-1">{movie.releaseDate?.split('-')[0]}</p>
        <p className="text-yellow-400 text-xs">★ {movie.rating.toFixed(1)}</p>
      </div>
    </div>
  );
}

// Movie Details Component
function MovieDetails({ movie }: { movie: MovieDetails }) {
  return (
    <div className="movie-details bg-gray-800 rounded-lg p-6">
      <div className="flex gap-6">
        {movie.posterUrl && (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-48 h-72 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-white mb-3">{movie.title}</h2>
          <div className="text-sm text-gray-400 mb-4 space-y-1">
            <p><strong>Release Date:</strong> {movie.releaseDate}</p>
            <p><strong>Rating:</strong> {movie.rating}/10 ({movie.vote_count} votes)</p>
            {movie.runtime && <p><strong>Runtime:</strong> {movie.runtime} minutes</p>}
            {movie.status && <p><strong>Status:</strong> {movie.status}</p>}
          </div>
          <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
        </div>
      </div>
    </div>
  );
}

// Main Movie Browser Component
export function MovieBrowser() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'grid' | 'details'>('grid');
  const { client, setConfig, setModel } = useLiveAPIContext();

  // Initialize AI configuration
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
            text: `You are a helpful movie assistant. You can:
            
            1. Search for movies by title or keywords using search_movies
            2. Get detailed movie information using get_movie_details  
            3. Show popular movies using get_popular_movies
            
            When users ask about movies, use the appropriate tools to help them find and learn about films. Keep responses conversational and helpful.`,
          },
        ],
      },
      tools: [
        { 
          functionDeclarations: [
            movieSearchDeclaration,
            movieDetailsDeclaration,
            popularMoviesDeclaration,
          ]
        },
      ],
    });
  }, [setConfig, setModel]);

  // Load popular movies on initial load
  useEffect(() => {
    loadPopularMovies();
  }, []);

  const loadPopularMovies = async () => {
    setLoading(true);
    try {
      const data = await makeAPICall("/api/movies/popular");
      setMovies(data.items || []);
    } catch (error) {
      console.error("Failed to load popular movies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieSelect = async (movie: Movie) => {
    setLoading(true);
    try {
      const details = await makeAPICall(`/api/movies/${movie.id}`);
      setSelectedMovie(details);
      setView('details');
    } catch (error) {
      console.error("Failed to load movie details:", error);
      // Fallback to basic movie info
      setSelectedMovie(movie as MovieDetails);
      setView('details');
    } finally {
      setLoading(false);
    }
  };

  // Handle AI tool calls
  useEffect(() => {
    const onToolCall = async (toolCall: LiveServerToolCall) => {
      if (!toolCall.functionCalls) return;

      const responses: Array<{
        response: { output: any };
        id: string;
        name: string;
      }> = [];
      
      for (const fc of toolCall.functionCalls) {
        let result;

        try {
          switch (fc.name) {
            case "search_movies":
              const { query, page = 1 } = fc.args as any;
              const searchData = await makeAPICall("/api/movies/search", { q: query, page });
              setMovies(searchData.items || []);
              setView('grid');
              result = { success: true, data: searchData };
              break;

            case "get_movie_details":
              const { movie_id } = fc.args as any;
              const detailsData = await makeAPICall(`/api/movies/${movie_id}`);
              setSelectedMovie(detailsData);
              setView('details');
              result = { success: true, data: detailsData };
              break;

            case "get_popular_movies":
              const { page: popularPage = 1 } = fc.args as any;
              const popularData = await makeAPICall("/api/movies/popular", { page: popularPage });
              setMovies(popularData.items || []);
              setView('grid');
              result = { success: true, data: popularData };
              break;

            default:
              result = { success: false, error: `Unknown function: ${fc.name}` };
          }
        } catch (error) {
          result = { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }

        responses.push({
          response: { output: result },
          id: fc.id || '',
          name: fc.name || '',
        });
      }

      // Send responses back to AI
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
    <div className="movie-browser h-full w-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Movie Browser</h1>
          <div className="flex gap-2">
            <button
              onClick={() => { setView('grid'); loadPopularMovies(); }}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                view === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Browse Movies
            </button>
            {selectedMovie && (
              <button
                onClick={() => setView('details')}
                className={`px-4 py-2 rounded text-sm transition-colors ${
                  view === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Movie Details
              </button>
            )}
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Ask the AI to search for movies or browse popular films
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading...</div>
          </div>
        )}

        {!loading && view === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onSelect={handleMovieSelect}
                isSelected={selectedMovie?.id === movie.id}
              />
            ))}
          </div>
        )}

        {!loading && view === 'details' && selectedMovie && (
          <MovieDetails movie={selectedMovie} />
        )}

        {!loading && view === 'grid' && movies.length === 0 && (
          <div className="text-center text-gray-500 mt-16">
            <p className="text-lg mb-2">🎬</p>
            <p>No movies found. Try asking the AI to search for movies or show popular films.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieBrowser;
