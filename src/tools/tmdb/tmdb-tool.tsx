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
import { motion } from "framer-motion";

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

// (Removed declarations for recommendations, reviews, and top rated to simplify integration)

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
    reviews?: any[]; // retained in state shape but no longer populated (simplification)
    altairSpec?: string;
  }>({});
  const { client, setConfig, setModel, setToolUIActive, toolUIActive } =
    useLiveAPIContext();

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
            text: `You are a helpful general assistant with extra movie and charting tools.

Available tools:
- search_movies: find movies when the user mentions or asks about a film.
- get_movie_details: fetch basic info (title, overview, poster, runtime/year) for a specific movie id when clarifying or answering questions.
- render_altair: render Altair/Vega-Lite charts for ANY data visualization request. Use this whenever the user asks for a chart/graph/visualization, or when a chart would clarify an answer. Provide a JSON STRING (stringified spec) in 'json_graph'.

Guidelines:
- Charts are not limited to movies. If the user asks for a chart (e.g., "use the graph tool", "plot", "visualize", "chart", "graph"), call render_altair with a sensible, minimal spec based on the described data. If needed, synthesize a tiny example dataset to illustrate the concept, and state that it's illustrative.
- Do NOT attempt recommendations, reviews, or top‑rated lists (those capabilities are disabled).
- Keep answers concise and focused. When combining narration with charts, keep the narrative brief and let the visualization carry the detail.
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

      // Immediately reveal the tool canvas for any tool activity
      setToolUIActive(true);

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
            const { movie_id } = fc.args as any;
            const detailsResult = await makeAPICall(`/api/movies/${movie_id}`);
            if (detailsResult.success) {
              setDisplayData({ movieDetails: detailsResult.data });
            }
            result = detailsResult;
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
  }, [client, setToolUIActive]);

  // Auto-hide tool UI when no content is displayed
  useEffect(() => {
    const hasContent =
      (Array.isArray(displayData.movies) && displayData.movies.length > 0) ||
      displayData.movieDetails ||
      displayData.altairSpec;

    if (!hasContent) {
      setToolUIActive(false);
    }
  }, [displayData, setToolUIActive]);

  return (
    <div className="tmdb-tool-container h-full w-full">
      <motion.div
        className="h-full w-full"
        animate={{
          display: toolUIActive ? "grid" : "flex",
          gridTemplateColumns: toolUIActive ? "repeat(5, 1fr)" : "none",
          gridTemplateRows: toolUIActive ? "repeat(5, 1fr)" : "none",
          gap: toolUIActive ? "1rem" : "0",
          flexDirection: toolUIActive ? "row" : "column",
          alignItems: toolUIActive ? "stretch" : "center",
          justifyContent: toolUIActive ? "stretch" : "center",
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.5,
        }}
      >
        {/* SiriOrb placeholder - spans 2 columns on left */}
        {toolUIActive && (
          <motion.div
            className="div1"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              gridColumn: "span 2 / span 2",
              gridRow: "span 5 / span 5",
            }}
          >
            {/* SiriOrb will be positioned here by the dashboard */}
            <div className="h-full flex items-center justify-center">
              <div className="text-sm text-muted-foreground">SiriOrb Area</div>
            </div>
          </motion.div>
        )}

        {/* Tool Canvas - spans 3 columns on right */}
        {toolUIActive && (
          <motion.div
            className="div2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              gridColumn: "span 3 / span 3",
              gridRow: "span 5 / span 5",
              gridColumnStart: 3,
            }}
          >
            <div className="h-full bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
              <div className="h-full overflow-auto p-6">
                <div className="text-sm text-muted-foreground mb-4">
                  Tool Results
                </div>

                {/* Tool content */}
                {Array.isArray(displayData.movies) &&
                  displayData.movies.length > 0 && (
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {displayData.movies
                        .slice(0, 6)
                        .map((m: any, index: number) => {
                          const ui = mapToUIMovie(m);
                          return (
                            <motion.div
                              key={ui.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                            >
                              <SharedMovieCard movie={ui} />
                            </motion.div>
                          );
                        })}
                    </motion.div>
                  )}

                {/* Optional details view if tool returned it */}
                {displayData.movieDetails && (
                  <motion.div
                    className="max-w-4xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="bg-card rounded-xl p-6">
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        {displayData.movieDetails.title}
                      </h2>
                      <p className="text-muted-foreground">
                        {displayData.movieDetails.overview}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Altair chart area */}
                {displayData.altairSpec && (
                  <motion.div
                    className="mt-6"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <AltairEmbed specString={displayData.altairSpec} />
                  </motion.div>
                )}

                {/* Show message if no content */}
                {!displayData.movies?.length &&
                  !displayData.movieDetails &&
                  !displayData.altairSpec && (
                    <div className="text-center text-muted-foreground py-8">
                      No tool results yet. Try asking for movies or charts!
                    </div>
                  )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Normal content area - only show when tool UI is not active */}
        {!toolUIActive && (
          <motion.div
            className="w-full"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Only render cards when movies are present; no default browser */}
            {Array.isArray(displayData.movies) &&
              displayData.movies.length > 0 && (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0 }}
                >
                  {displayData.movies
                    .slice(0, 6)
                    .map((m: any, index: number) => {
                      const ui = mapToUIMovie(m);
                      return (
                        <motion.div
                          key={ui.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <SharedMovieCard movie={ui} />
                        </motion.div>
                      );
                    })}
                </motion.div>
              )}

            {/* Optional details view if tool returned it */}
            {displayData.movieDetails && (
              <motion.div
                className="max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="bg-card rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {displayData.movieDetails.title}
                  </h2>
                  <p className="text-muted-foreground">
                    {displayData.movieDetails.overview}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Altair chart area */}
            {displayData.altairSpec && (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <AltairEmbed specString={displayData.altairSpec} />
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
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
