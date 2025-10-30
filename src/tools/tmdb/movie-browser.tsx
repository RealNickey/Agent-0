import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import {
  FunctionDeclaration,
  LiveServerToolCall,
  Modality,
  Type,
} from "@google/genai";

// Tool declarations for movie functionality
const movieToolDeclarations: FunctionDeclaration[] = [
  {
    name: "search_movies",
    description: "Search for movies by title or keywords",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Movie title or search query",
        },
        page: {
          type: Type.NUMBER,
          description: "Page number (default: 1)",
          default: 1,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_movie_details",
    description: "Get detailed information about a specific movie",
    parameters: {
      type: Type.OBJECT,
      properties: {
        movie_id: { type: Type.NUMBER, description: "The TMDb movie ID" },
      },
      required: ["movie_id"],
    },
  },
];

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

// Client-side caching for better performance
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function makeAPICall(endpoint: string, params: Record<string, any> = {}) {
  const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;
  const cached = apiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const url = new URL(endpoint, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    apiCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}

// Movie Card Component
const MovieCard = React.memo(function MovieCard({
  movie,
  onSelect,
  isSelected,
}: {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  isSelected: boolean;
}) {
  return (
    <div
      className={`bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-105 ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
      onClick={() => onSelect(movie)}
    >
      {movie.posterUrl && (
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-64 object-cover"
          loading="lazy"
        />
      )}
      <div className="p-3">
        <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">
          {movie.title}
        </h3>
        <p className="text-gray-400 text-xs mb-1">
          {movie.releaseDate?.split("-")[0]}
        </p>
        <p className="text-yellow-400 text-xs">★ {movie.rating.toFixed(1)}</p>
      </div>
    </div>
  );
});

MovieCard.displayName = "MovieCard";

// Movie Details Component
const MovieDetailsView = React.memo(function MovieDetailsView({
  movie,
}: {
  movie: MovieDetails;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex gap-6">
        {movie.posterUrl && (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-48 h-72 object-cover rounded-lg flex-shrink-0"
            loading="lazy"
          />
        )}
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-white mb-3">{movie.title}</h2>
          <div className="text-sm text-gray-400 mb-4 space-y-1">
            <p>
              <strong>Release:</strong> {movie.releaseDate}
            </p>
            <p>
              <strong>Rating:</strong> {movie.rating}/10{" "}
              {movie.vote_count && `(${movie.vote_count} votes)`}
            </p>
            {movie.runtime && (
              <p>
                <strong>Runtime:</strong> {movie.runtime} min
              </p>
            )}
          </div>
          <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
        </div>
      </div>
    </div>
  );
});

MovieDetailsView.displayName = "MovieDetailsView";

// Main Movie Browser Component
export default function MovieBrowser() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"grid" | "details">("grid");
  const { client, setConfig, setModel } = useLiveAPIContext();

  // Configuration for the AI assistant
  const config = useMemo(
    () => ({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
      },
      systemInstruction: {
        parts: [
          {
            text: `You are a movie assistant. Use the available tools to help users find and learn about films.`,
          },
        ],
      },
      tools: [{ functionDeclarations: movieToolDeclarations }],
    }),
    []
  );

  // Initialize AI configuration
  useEffect(() => {
    setModel("models/gemini-live-2.5-flash-preview");
    setConfig(config);
  }, [setConfig, setModel, config]);

  // Handle movie selection
  const handleMovieSelect = useCallback(
    async (movie: Movie) => {
      if (selectedMovie?.id === movie.id) {
        setView("details");
        return;
      }

      setLoading(true);
      try {
        const details = await makeAPICall(`/api/movies/${movie.id}`);
        setSelectedMovie(details);
        setView("details");
      } catch (error) {
        console.error("Failed to load movie details:", error);
        setSelectedMovie(movie as MovieDetails);
        setView("details");
      } finally {
        setLoading(false);
      }
    },
    [selectedMovie?.id]
  );

  // Handle tool calls from AI
  useEffect(() => {
    const onToolCall = async (toolCall: LiveServerToolCall) => {
      if (!toolCall.functionCalls) return;

      const responses = await Promise.all(
        toolCall.functionCalls.map(async (fc) => {
          let result;
          try {
            switch (fc.name) {
              case "search_movies":
                const { query, page = 1 } = fc.args as any;
                const searchData = await makeAPICall("/api/movies/search", {
                  q: query,
                  page,
                });
                setMovies(searchData.items || []);
                setView("grid");
                result = {
                  success: true,
                  count: searchData.items?.length || 0,
                };
                break;

              case "get_movie_details":
                const { movie_id } = fc.args as any;
                const detailsData = await makeAPICall(
                  `/api/movies/${movie_id}`
                );
                setSelectedMovie(detailsData);
                setView("details");
                result = { success: true, movie: detailsData.title };
                break;

              default:
                result = {
                  success: false,
                  error: `Unknown function: ${fc.name}`,
                };
            }
          } catch (error) {
            result = {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }

          return {
            response: { output: result },
            id: fc.id || "",
            name: fc.name || "",
          };
        })
      );

      client.sendToolResponse({ functionResponses: responses });
    };

    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);

  const handleViewChange = useCallback((newView: "grid" | "details") => {
    setView(newView);
  }, []);

  return (
    <div className="movie-browser h-full w-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Movie Browser</h1>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewChange("grid")}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                view === "grid"
                  ? "bg-blue-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              Browse
            </button>
            {selectedMovie && (
              <button
                onClick={() => handleViewChange("details")}
                className={`px-4 py-2 rounded text-sm transition-colors ${
                  view === "details"
                    ? "bg-blue-600"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                Details
              </button>
            )}
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Ask AI to search for movies or request details about a title
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading...</div>
          </div>
        )}

        {!loading && view === "grid" && (
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

        {!loading && view === "details" && selectedMovie && (
          <MovieDetailsView movie={selectedMovie} />
        )}

        {!loading && view === "grid" && movies.length === 0 && (
          <div className="text-center text-gray-500 mt-16">
            <p className="text-lg mb-2">🎬</p>
            <p>Ask AI to search for movies or request specific details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
