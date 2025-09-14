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
  description:
    "Get detailed information about a specific movie including cast, crew, and reviews",
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

// Altair visualization declaration (duplicated here for unified tool registry)
const altairRenderDeclaration: FunctionDeclaration = {
  name: "render_altair",
  description:
    "Render an Altair/vega-lite JSON specification. Provide the spec as a JSON STRING (stringified). Use after obtaining or synthesizing structured data you want to visualize.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      json_graph: {
        type: Type.STRING,
        description:
          "JSON STRING specification for the chart (vega-lite / altair). Must already be stringified.",
      },
    },
    required: ["json_graph"],
  },
};

// Tool response interface
interface MovieToolResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Helper function to make API calls to our Next.js routes
async function makeAPICall(
  endpoint: string,
  params: Record<string, any> = {}
): Promise<MovieToolResponse> {
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
        error:
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
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
  const year =
    (apiMovie.releaseDate || apiMovie.release_date || "").split("-")[0] || 0;
  return {
    id: apiMovie.id,
    title: apiMovie.title || "",
    genre: (apiMovie.genres?.[0]?.name as string) || "Movie",
    rating:
      typeof apiMovie.rating === "number"
        ? apiMovie.rating
        : apiMovie.vote_average ?? 0,
    duration: apiMovie.runtime ? `${apiMovie.runtime} min` : "",
    year: Number(year) || 0,
    poster:
      apiMovie.posterUrl ||
      (apiMovie.poster_path
        ? `https://image.tmdb.org/t/p/w342${apiMovie.poster_path}`
        : ""),
    backdrop:
      apiMovie.backdropUrl ||
      (apiMovie.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${apiMovie.backdrop_path}`
        : ""),
    description: apiMovie.overview || "",
    director:
      (apiMovie.credits?.crew?.find((c: any) => c.job === "Director")
        ?.name as string) || "",
  };
}

export function TMDbTool() {
  const [displayData, setDisplayData] = useState<{
    movies?: any[];
    movieDetails?: any;
    reviews?: any[];
    altairSpec?: string;
  }>({});
  const { client, setConfig, setModel } = useLiveAPIContext();

  useEffect(() => {
    setModel("models/gemini-live-2.5-flash-preview");
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
      },
      systemInstruction: {
        parts: [
          {
            text: `You are an autonomous multimodal research & analysis assistant.

When the user asks a question:
1. Decide which tools are helpful WITHOUT asking the user to pick.
2. You may chain tools. Example: search_movies -> get_movie_details -> render_altair to chart ratings or release trends. Or use googleSearch first for broader context, then movie tools.
3. Use movie tools for any film / cinema / actor / recommendation / comparison queries.
4. Use googleSearch for timely, general, or non‑TMDb facts, or to enrich context before recommendations.
5. Use render_altair whenever a visual comparison, distribution, trend, or ranking would clarify the answer. Provide a concise natural language explanation after the chart.

Guidelines:
- Do not ask the user which tool to use; just act.
- Prefer minimal number of calls but make additional calls if they add meaningful value (e.g., details + recommendations).
- For charts: keep specs simple (bar, line, scatter) unless complexity is explicitly requested.
- Always return a helpful synthesized answer referencing insights from the tool outputs.
`,
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
            altairRenderDeclaration,
          ],
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
            result = await makeAPICall("/api/movies/search", {
              q: query,
              page,
              year,
            });
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
              const reviewsResult = await makeAPICall(
                `/api/movies/${movie_id}/reviews`
              );
              if (reviewsResult.success) {
                reviewsData = reviewsResult.data?.results || [];
              }
            }

            if (detailsResult.success) {
              setDisplayData({
                movieDetails: detailsResult.data,
                reviews: reviewsData,
              });
              result = {
                success: true,
                data: {
                  movie: detailsResult.data,
                  reviews: reviewsData?.slice(0, 5), // Limit reviews in response
                },
              };
            } else {
              result = detailsResult;
            }
            break;

          case "get_popular_movies":
            const { page: popularPage = 1 } = fc.args as any;
            result = await makeAPICall("/api/movies/popular", {
              page: popularPage,
            });
            if (result.success && result.data?.items) {
              setDisplayData({ movies: result.data.items });
            }
            break;

          case "get_top_rated_movies":
            const { page: topRatedPage = 1 } = fc.args as any;
            result = await makeAPICall("/api/movies/top-rated", {
              page: topRatedPage,
            });
            if (result.success && result.data?.items) {
              setDisplayData({ movies: result.data.items });
            }
            break;

          case "get_movie_recommendations":
            const { movie_id: recMovieId, page: recPage = 1 } = fc.args as any;
            result = await makeAPICall(
              `/api/movies/${recMovieId}/recommendations`,
              { page: recPage }
            );
            if (result.success && result.data?.items) {
              setDisplayData({ movies: result.data.items });
            }
            break;

          case "render_altair":
            // Accept the spec string and update local state; acknowledge success.
            const { json_graph } = fc.args as any;
            try {
              // Validate it parses; if not, return error
              JSON.parse(json_graph);
              setDisplayData((d) => ({ ...d, altairSpec: json_graph }));
              result = { success: true, data: { rendered: true } };
            } catch (e: any) {
              result = {
                success: false,
                error: `Invalid JSON spec: ${e?.message}`,
              };
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
          id: fc.id || "",
          name: fc.name || "",
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
            <div className="bg-card rounded-xl p-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {displayData.movieDetails.title}
              </h2>
              <p className="text-muted-foreground">
                {displayData.movieDetails.overview}
              </p>
            </div>
          </div>
        )}

        {/* Altair chart area */}
        {displayData.altairSpec && (
          <div className="mt-6">
            <AltairEmbed specString={displayData.altairSpec} />
          </div>
        )}
      </div>
    </div>
  );
}

// Lightweight embedded Altair renderer (client-side)
function AltairEmbed({ specString }: { specString: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    import("vega-embed").then(({ default: vegaEmbed }) => {
      if (!cancelled && ref.current) {
        try {
          vegaEmbed(ref.current!, JSON.parse(specString));
        } catch (e) {
          console.error("Failed to render altair spec", e);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [specString]);
  return <div ref={ref} className="vega-embed" />;
}

export default TMDbTool;
