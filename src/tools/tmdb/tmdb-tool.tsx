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
import { useToolCallUI } from "@/contexts/ToolCallUIContext";
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
  const { client, setConfig, setModel } = useLiveAPIContext();
  const { addToolCallUI, removeToolCallUI } = useToolCallUI();

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
            text: `You are a helpful movie assistant.

Available actions:
- search_movies: find movies when the user mentions or asks about a film.
- get_movie_details: fetch basic info (title, overview, poster, runtime/year) for a specific movie id when clarifying or answering questions.
- render_altair: ONLY if the user explicitly asks for a simple chart (e.g. "show a bar chart of these movies"), otherwise skip visualization.

Guidelines:
- Do NOT attempt recommendations, reviews, or top‑rated lists (those capabilities are disabled).
- If the user asks a general question unrelated to movies, answer normally without calling movie tools.
- Keep answers concise and focused.
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

      const responses: Array<{
        response: { output: MovieToolResponse };
        id: string;
        name: string;
      }> = [];

      for (const fc of toolCall.functionCalls) {
        let result: MovieToolResponse;
        const toolCallId = fc.id || `tool-${Date.now()}`;

        switch (fc.name) {
          case "search_movies":
            const { query, page = 1, year } = fc.args as any;
            result = await makeAPICall("/api/movies/search", {
              q: query,
              page,
              year,
            });
            if (result.success && result.data?.items) {
              addToolCallUI(
                toolCallId,
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {result.data.items.slice(0, 6).map((m: any) => {
                    const ui = mapToUIMovie(m);
                    return <SharedMovieCard key={ui.id} movie={ui} />;
                  })}
                </div>
              );
            }
            break;

          case "get_movie_details":
            const { movie_id } = fc.args as any;
            const detailsResult = await makeAPICall(`/api/movies/${movie_id}`);
            if (detailsResult.success) {
              addToolCallUI(
                toolCallId,
                <div className="max-w-4xl mx-auto">
                  <div className="bg-card rounded-xl p-6">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      {detailsResult.data.title}
                    </h2>
                    <p className="text-muted-foreground">
                      {detailsResult.data.overview}
                    </p>
                  </div>
                </div>
              );
            }
            result = detailsResult;
            break;

          case "render_altair":
            const { json_graph } = fc.args as any;
            try {
              JSON.parse(json_graph);
              addToolCallUI(
                toolCallId,
                <div className="mt-6">
                  <AltairEmbed specString={json_graph} />
                </div>
              );
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
  }, [client, addToolCallUI, removeToolCallUI]);

  return null;
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
