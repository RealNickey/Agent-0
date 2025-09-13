/**
 * Simplified Movie Review Tool Component
 * Provides movie browsing with AI review generation
 */

import React, { useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { TMDbTool } from "./tmdb-tool";

interface Movie {
  id: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string;
  rating: number;
}

export function MovieReviewTool() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const { client, connected } = useLiveAPIContext();

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const generateAIReview = async () => {
    if (!selectedMovie || !connected) return;

    setIsGeneratingReview(true);
    try {
      const prompt = `Please provide a comprehensive movie review for "${
        selectedMovie.title
      }" (${selectedMovie.releaseDate?.split("-")[0]}). 
      
      Movie Overview: ${selectedMovie.overview}
      Rating: ${selectedMovie.rating}/10
      
      Include: plot summary (no spoilers), analysis of acting/direction/cinematography, 
      pros/cons, target audience, and your rating/recommendation (200-300 words).`;

      client.send({ text: prompt });
    } catch (error) {
      console.error("Failed to generate AI review:", error);
    } finally {
      setIsGeneratingReview(false);
    }
  };

  return (
    <div className="movie-review-tool h-full flex">
      {/* Left panel - Movie browser */}
      <div className="w-1/2 border-r border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Movie Browser</h2>
          <p className="text-muted-foreground text-sm">
            Search and browse movies, then select one to review
          </p>
        </div>
        <div className="h-full overflow-auto">
          <TMDbTool />
        </div>
      </div>

      {/* Right panel - Review section */}
      <div className="w-1/2 flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">AI Movie Review</h2>
          {selectedMovie ? (
            <p className="text-muted-foreground text-sm">
              Generate review for {selectedMovie.title}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Select a movie to generate an AI review
            </p>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {selectedMovie ? (
            <div className="space-y-4">
              {/* Selected Movie Info */}
              <div className="bg-card rounded-lg p-4">
                <div className="flex gap-4">
                  {selectedMovie.posterUrl && (
                    <img
                      src={selectedMovie.posterUrl}
                      alt={selectedMovie.title}
                      className="w-24 h-36 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {selectedMovie.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {selectedMovie.releaseDate?.split("-")[0]}
                    </p>
                    <p className="text-accent text-sm">
                      ★ {selectedMovie.rating.toFixed(1)}/10
                    </p>
                    <button
                      onClick={generateAIReview}
                      disabled={isGeneratingReview || !connected}
                      className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-sm"
                    >
                      {isGeneratingReview
                        ? "Generating..."
                        : "Generate AI Review"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Movie Overview */}
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  Overview
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {selectedMovie.overview}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">🎬</p>
                <p>Select a movie from the browser to generate a review</p>
                <p className="text-sm mt-2">
                  Ask the AI to search for movies or show popular films
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MovieReviewTool;
