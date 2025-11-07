/**
 * TMDb Movie Tool for AI SDK Integration
 * Provides movie search, details, and review functionality
 */

import React, { useEffect, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { toolToasts } from "../../lib/toast";
import {
  FunctionDeclaration,
  LiveServerToolCall,
  Modality,
  Type,
} from "@google/genai";
import { motion } from "framer-motion";
import ArcCountdown from "../../components/arc-countdown";

// Timer tool declarations
const startTimerDeclaration: FunctionDeclaration = {
  name: "start_timer",
  description: "Start the countdown timer or stopwatch",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
};

const stopTimerDeclaration: FunctionDeclaration = {
  name: "stop_timer",
  description: "Stop and reset the timer or stopwatch",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
};

const pauseTimerDeclaration: FunctionDeclaration = {
  name: "pause_timer",
  description: "Pause the running timer or stopwatch",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
};

const resumeTimerDeclaration: FunctionDeclaration = {
  name: "resume_timer",
  description: "Resume a paused timer or stopwatch",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
};

const setTimerDurationDeclaration: FunctionDeclaration = {
  name: "set_timer_duration",
  description: "Set the duration for the countdown timer in seconds",
  parameters: {
    type: Type.OBJECT,
    properties: {
      seconds: {
        type: Type.NUMBER,
        description: "Duration in seconds for the countdown timer",
      },
    },
    required: ["seconds"],
  },
};

const addTimeDeclaration: FunctionDeclaration = {
  name: "add_time",
  description: "Add additional time to the running timer",
  parameters: {
    type: Type.OBJECT,
    properties: {
      seconds: {
        type: Type.NUMBER,
        description: "Number of seconds to add to the timer",
      },
    },
    required: ["seconds"],
  },
};

const switchModeDeclaration: FunctionDeclaration = {
  name: "switch_timer_mode",
  description: "Switch between countdown timer and stopwatch modes",
  parameters: {
    type: Type.OBJECT,
    properties: {
      mode: {
        type: Type.STRING,
        description: "Mode to switch to: 'countdown' or 'stopwatch'",
      },
    },
    required: ["mode"],
  },
};

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

// Timer function call argument interfaces
interface SetTimerDurationArgs {
  seconds: number;
}

interface AddTimeArgs {
  seconds: number;
}

interface SwitchTimerModeArgs {
  mode: "countdown" | "stopwatch";
}

interface SearchMoviesArgs {
  query: string;
  page?: number;
  year?: number;
}

interface GetMovieDetailsArgs {
  movie_id: number;
  include_reviews?: boolean;
}

interface RenderAltairArgs {
  json_graph: string;
}

// Constants
const DEFAULT_TIMER_SECONDS = 140; // 2 minutes 20 seconds

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

type TimerMode = "countdown" | "stopwatch";
type DisplayContent = "timer" | "movies" | "movie_details" | "chart" | null;

export function TMDbTool() {
  // Timer state
  const [timerMode, setTimerMode] = useState<TimerMode>("countdown");
  const [isPaused, setIsPaused] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [initialSeconds, setInitialSeconds] = useState(DEFAULT_TIMER_SECONDS);
  const [timerKey, setTimerKey] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(DEFAULT_TIMER_SECONDS);

  // Display state
  const [displayContent, setDisplayContent] = useState<DisplayContent>(null);
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
            text: `You are a helpful general assistant with timer, movie search, and charting capabilities.

Available timer tools:
- start_timer: Start the countdown timer or stopwatch
- stop_timer: Stop and reset the timer or stopwatch
- pause_timer: Pause the running timer or stopwatch
- resume_timer: Resume a paused timer or stopwatch
- set_timer_duration: Set the duration for countdown timer in seconds (e.g., 60 for 1 minute, 300 for 5 minutes)
- add_time: Add additional time to the running timer in seconds
- switch_timer_mode: Switch between 'countdown' or 'stopwatch' modes

Available movie tools:
- search_movies: find movies when the user mentions or asks about a film.
- get_movie_details: fetch basic info (title, overview, poster, runtime/year) for a specific movie id when clarifying or answering questions.

Available charting tools:
- render_altair: render Altair/Vega-Lite charts for ANY data visualization request. Use this whenever the user asks for a chart/graph/visualization, or when a chart would clarify an answer. Provide a JSON STRING (stringified spec) in 'json_graph'.

Guidelines:
- Use timer tools when the user asks to set a timer, start a stopwatch, or manage time.
- The timer is persistent and maintains state across calls.
- Only activate the timer UI when explicitly called.
- Charts are not limited to movies. If the user asks for a chart (e.g., "use the graph tool", "plot", "visualize", "chart", "graph"), call render_altair with a sensible, minimal spec based on the described data. If needed, synthesize a tiny example dataset to illustrate the concept, and state that it's illustrative.
- Do NOT attempt recommendations, reviews, or top‑rated lists (those capabilities are disabled).
- Keep answers concise and focused. When combining narration with charts, keep the narrative brief and let the visualization carry the detail.
- When setting a timer, convert user-friendly durations (like "5 minutes") to seconds (300).
`,
          },
        ],
      },
      tools: [
        { googleSearch: {} },
        {
          functionDeclarations: [
            // Timer tools
            startTimerDeclaration,
            stopTimerDeclaration,
            pauseTimerDeclaration,
            resumeTimerDeclaration,
            setTimerDurationDeclaration,
            addTimeDeclaration,
            switchModeDeclaration,
            // Movie tools
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
          // Timer functions
          case "start_timer":
            setDisplayContent("timer");
            setIsStarted(true);
            setIsPaused(false);
            result = {
              success: true,
              data: {
                action: "started",
                mode: timerMode,
                duration: timerMode === "countdown" ? currentSeconds : 0,
              },
            };
            break;

          case "stop_timer":
            setDisplayContent("timer");
            setIsStarted(false);
            setIsPaused(true);
            setTimerKey((prev) => prev + 1);
            result = {
              success: true,
              data: { action: "stopped" },
            };
            break;

          case "pause_timer":
            setDisplayContent("timer");
            setIsPaused(true);
            result = {
              success: true,
              data: { action: "paused" },
            };
            break;

          case "resume_timer":
            setDisplayContent("timer");
            if (isStarted) {
              setIsPaused(false);
              result = {
                success: true,
                data: { action: "resumed" },
              };
            } else {
              result = {
                success: false,
                error: "Timer is not started. Use start_timer first.",
              };
            }
            break;

          case "set_timer_duration":
            setDisplayContent("timer");
            const { seconds } = fc.args as unknown as SetTimerDurationArgs;
            if (seconds && seconds > 0) {
              setTimerMode("countdown");
              setInitialSeconds(seconds);
              setCurrentSeconds(seconds);
              setTimerKey((prev) => prev + 1);
              setIsStarted(true);
              setIsPaused(false);
              result = {
                success: true,
                data: {
                  action: "duration_set",
                  seconds,
                  minutes: Math.floor(seconds / 60),
                },
              };
            } else {
              result = {
                success: false,
                error: "Invalid duration. Seconds must be greater than 0.",
              };
            }
            break;

          case "add_time":
            setDisplayContent("timer");
            const { seconds: addSeconds } = fc.args as unknown as AddTimeArgs;
            if (addSeconds && addSeconds > 0) {
              const newSeconds = currentSeconds + addSeconds;
              setCurrentSeconds(newSeconds);
              setInitialSeconds(newSeconds);
              setTimerKey((prev) => prev + 1);
              // Keep timer running if it was running
              // No need to set isPaused to false if it's already running
              result = {
                success: true,
                data: {
                  action: "time_added",
                  added_seconds: addSeconds,
                  total_seconds: newSeconds,
                },
              };
            } else {
              result = {
                success: false,
                error: "Invalid time. Seconds must be greater than 0.",
              };
            }
            break;

          case "switch_timer_mode":
            setDisplayContent("timer");
            const { mode: newMode } = fc.args as unknown as SwitchTimerModeArgs;
            if (newMode === "countdown" || newMode === "stopwatch") {
              setTimerMode(newMode as TimerMode);
              setTimerKey((prev) => prev + 1);
              setIsStarted(false);
              setIsPaused(true);
              setInitialSeconds(
                newMode === "countdown" ? DEFAULT_TIMER_SECONDS : 0
              );
              setCurrentSeconds(
                newMode === "countdown" ? DEFAULT_TIMER_SECONDS : 0
              );
              result = {
                success: true,
                data: {
                  action: "mode_switched",
                  mode: newMode,
                },
              };
            } else {
              result = {
                success: false,
                error: "Invalid mode. Use 'countdown' or 'stopwatch'.",
              };
            }
            break;

          // Movie functions
          case "search_movies":
            const {
              query,
              page = 1,
              year,
            } = fc.args as unknown as SearchMoviesArgs;
            toolToasts.searchStarted(query);
            // Clear previous data before new search
            setDisplayContent("movies");
            setDisplayData({});
            result = await makeAPICall("/api/movies/search", {
              q: query,
              page,
              year,
            });
            if (result.success && result.data?.items) {
              setDisplayData({ movies: result.data.items });
              toolToasts.searchSuccess(result.data.items.length);
            } else {
              toolToasts.searchError(result.error);
            }
            break;

          case "get_movie_details":
            // Clear previous data before new details
            setDisplayContent("movie_details");
            setDisplayData({});
            const { movie_id } = fc.args as unknown as GetMovieDetailsArgs;
            const detailsResult = await makeAPICall(`/api/movies/${movie_id}`);
            if (detailsResult.success) {
              setDisplayData({ movieDetails: detailsResult.data });
            } else {
              toolToasts.apiError("TMDb", detailsResult.error);
            }
            result = detailsResult;
            break;

          case "render_altair":
            // Clear previous data before new chart
            setDisplayContent("chart");
            setDisplayData({});
            // Accept the spec string and update local state; acknowledge success.
            const { json_graph } = fc.args as unknown as RenderAltairArgs;
            try {
              // Validate it parses; if not, return error
              JSON.parse(json_graph);
              setDisplayData({ altairSpec: json_graph });
              result = { success: true, data: { rendered: true } };
            } catch (e: any) {
              result = {
                success: false,
                error: `Invalid JSON spec: ${e?.message}`,
              };
            }
            break;

          default:
            toolToasts.apiError("Tool", `Unknown function: ${fc.name}`);
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

    const onClose = () => {
      // Clear canvas and close it when call ends
      setDisplayContent(null);
      setDisplayData({});
      setToolUIActive(false);
    };

    client.on("toolcall", onToolCall);
    client.on("close", onClose);
    return () => {
      client.off("toolcall", onToolCall);
      client.off("close", onClose);
    };
  }, [client, setToolUIActive]);

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
                {/* Timer Display */}
                {displayContent === "timer" && (
                  <motion.div
                    className="h-full flex flex-col items-center justify-center gap-6"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="text-2xl font-semibold text-foreground mb-2">
                      {timerMode === "countdown"
                        ? "Countdown Timer"
                        : "Stopwatch"}
                    </div>
                    <ArcCountdown
                      key={timerKey}
                      initialSeconds={initialSeconds}
                      radius={160}
                      mode={timerMode}
                      isPaused={isPaused}
                      onTimeChange={setCurrentSeconds}
                    />
                    <div className="text-sm text-muted-foreground">
                      {!isStarted && "Ready to start"}
                      {isStarted && isPaused && "Paused"}
                      {isStarted && !isPaused && "Running"}
                    </div>
                  </motion.div>
                )}

                {/* Movies Display */}
                {displayContent === "movies" &&
                  Array.isArray(displayData.movies) &&
                  displayData.movies.length > 0 && (
                    <motion.div
                      className="grid grid-cols-2 lg:grid-cols-3 gap-1"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {displayData.movies
                        .slice(0, 9)
                        .map((m: any, index: number) => {
                          const ui = mapToUIMovie(m);
                          return (
                            <motion.div
                              key={ui.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 + index * 0.05 }}
                              className="transform scale-[0.45] origin-top"
                              style={{
                                marginBottom: "-58%",
                              }}
                            >
                              <SharedMovieCard movie={ui} />
                            </motion.div>
                          );
                        })}
                    </motion.div>
                  )}

                {/* Movie Details Display */}
                {displayContent === "movie_details" &&
                  displayData.movieDetails && (
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

                {/* Altair chart area - 80% of canvas width */}
                {displayContent === "chart" && displayData.altairSpec && (
                  <motion.div
                    className="mt-6 w-[80%] mx-auto"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <AltairEmbed specString={displayData.altairSpec} />
                  </motion.div>
                )}

                {/* Show message if no content */}
                {!displayContent && (
                  <div className="text-center text-muted-foreground py-8">
                    No tool results yet. Try asking for movies, charts, or
                    setting a timer!
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Content area when tool UI is not active - empty/centered state */}
        {!toolUIActive && (
          <motion.div
            className="w-full h-full flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Empty state - no message needed */}
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
