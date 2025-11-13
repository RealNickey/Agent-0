/**
 * TMDb Movie Tool for AI SDK Integration
 * Provides movie search, details, and review functionality
 */

import React, { useEffect, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { toolToasts, showToast } from "../../lib/toast";
import {
  FunctionDeclaration,
  LiveServerToolCall,
  Modality,
  Type,
} from "@google/genai";
import { motion } from "framer-motion";
import { FileUpload } from "../../components/ui/file-upload";
import { PDFDocument } from "pdf-lib";

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

// PDF Compressor declaration
const pdfCompressDeclaration: FunctionDeclaration = {
  name: "compress_pdf",
  description: "Open a file upload interface for the user to upload a PDF file for compression. Call this when the user asks to compress a PDF or needs help with PDF compression.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      open_upload: {
        type: Type.BOOLEAN,
        description: "Set to true to open the file upload interface",
        default: true,
      },
    },
    required: [],
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
    showPdfUpload?: boolean;
  }>({});
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStatus, setCompressionStatus] = useState<string>("");
  const { client, setConfig, setModel, setToolUIActive, toolUIActive } =
    useLiveAPIContext();

  // Compress PDF using pdf-lib
  const compressPDF = async (file: File): Promise<void> => {
    setIsCompressing(true);
    setCompressionStatus("Reading PDF...");
    
    try {
      // Read the uploaded PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      setCompressionStatus("Compressing PDF...");
      
      // Save with compression options
      const compressedPdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      
      const originalSize = file.size;
      const compressedSize = compressedPdfBytes.length;
      const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      
      setCompressionStatus(`Compressed! Saved ${savings}% (${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB)`);
      
      // Create download link
      const blob = new Blob([compressedPdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(".pdf", "_compressed.pdf");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast.success("PDF Compressor", `PDF compressed successfully! Saved ${savings}%`);
      
      // Clear upload after a delay
      setTimeout(() => {
        setDisplayData({});
        setCompressionStatus("");
        setToolUIActive(false);
      }, 3000);
      
    } catch (error) {
      console.error("Compression error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      setCompressionStatus(`Error: ${errorMsg}`);
      toolToasts.apiError("PDF Compressor", errorMsg);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      
      // Validate that it's a PDF
      if (file.type !== "application/pdf") {
        toolToasts.apiError("PDF Compressor", "Please upload a PDF file");
        return;
      }
      
      compressPDF(file);
    }
  };

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
            text: `You are a helpful general assistant with extra movie, charting, and PDF compression tools.

Available tools:
- search_movies: find movies when the user mentions or asks about a film.
- get_movie_details: fetch basic info (title, overview, poster, runtime/year) for a specific movie id when clarifying or answering questions.
- render_altair: render Altair/Vega-Lite charts for ANY data visualization request. Use this whenever the user asks for a chart/graph/visualization, or when a chart would clarify an answer. Provide a JSON STRING (stringified spec) in 'json_graph'.
- compress_pdf: open a file upload interface for PDF compression. Use this when the user asks to compress a PDF, needs help with PDF compression, or wants to reduce PDF file size.

Guidelines:
- Charts are not limited to movies. If the user asks for a chart (e.g., "use the graph tool", "plot", "visualize", "chart", "graph"), call render_altair with a sensible, minimal spec based on the described data. If needed, synthesize a tiny example dataset to illustrate the concept, and state that it's illustrative.
- For PDF compression requests, call compress_pdf to open the upload interface and guide the user to upload their PDF file.
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
            pdfCompressDeclaration,
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
            toolToasts.searchStarted(query);
            // Clear previous data before new search
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
            setDisplayData({});
            const { movie_id } = fc.args as any;
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
            setDisplayData({});
            // Accept the spec string and update local state; acknowledge success.
            const { json_graph } = fc.args as any;
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

          case "compress_pdf":
            // Clear previous data and open PDF upload interface
            setDisplayData({});
            setDisplayData({ showPdfUpload: true });
            setCompressionStatus("");
            result = {
              success: true,
              data: { message: "File upload interface opened. Waiting for user to upload a PDF file." },
            };
            showToast.success("PDF Compressor", "Please upload a PDF file to compress");
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
                {/* Tool content */}
                {Array.isArray(displayData.movies) &&
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

                {/* Altair chart area - 80% of canvas width */}
                {displayData.altairSpec && (
                  <motion.div
                    className="mt-6 w-[80%] mx-auto"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <AltairEmbed specString={displayData.altairSpec} />
                  </motion.div>
                )}

                {/* PDF Upload and Compression UI */}
                {displayData.showPdfUpload && (
                  <motion.div
                    className="max-w-2xl w-full mx-auto"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden p-8">
                      <h2 className="text-2xl font-bold text-foreground mb-4 text-center">
                        PDF Compressor
                      </h2>
                      <p className="text-muted-foreground mb-6 text-center">
                        Upload a PDF file to compress it and reduce its size
                      </p>
                      
                      <FileUpload onChange={handleFileChange} />
                      
                      {isCompressing && (
                        <motion.div
                          className="mt-6 text-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-foreground">{compressionStatus}</p>
                          </div>
                        </motion.div>
                      )}
                      
                      {compressionStatus && !isCompressing && (
                        <motion.div
                          className="mt-6 text-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <p className="text-foreground font-medium">{compressionStatus}</p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Show message if no content */}
                {!displayData.movies?.length &&
                  !displayData.movieDetails &&
                  !displayData.altairSpec &&
                  !displayData.showPdfUpload && (
                    <div className="text-center text-muted-foreground py-8">
                      No tool results yet. Try asking for movies, charts, or PDF compression!
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
