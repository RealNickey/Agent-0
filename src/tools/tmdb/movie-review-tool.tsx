/**
 * Movie Review Tool Component
 * Provides an interface for browsing movies and generating AI-powered reviews
 */

import React, { useState, useEffect } from "react";
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

interface Review {
  id: string;
  author: string;
  content: string;
  author_details?: {
    rating?: number;
    username?: string;
  };
}

export function MovieReviewTool() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const { client, connected } = useLiveAPIContext();

  const handleMovieSelect = async (movie: Movie) => {
    setSelectedMovie(movie);

    // Fetch existing reviews
    try {
      const response = await fetch(`/api/movies/${movie.id}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.results || []);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const generateAIReview = async () => {
    if (!selectedMovie || !connected) return;

    setIsGeneratingReview(true);

    try {
      // Send a prompt to the AI to generate a review
      const prompt = `Please provide a comprehensive movie review for "${
        selectedMovie.title
      }" (${selectedMovie.releaseDate?.split("-")[0]}). 
      
      Movie Overview: ${selectedMovie.overview}
      Rating: ${selectedMovie.rating}/10
      
      Please include:
      1. A brief plot summary (without major spoilers)
      2. Analysis of acting, direction, cinematography
      3. What worked well and what didn't
      4. Who would enjoy this movie
      5. Your overall rating and recommendation
      
      Make it engaging and informative, around 200-300 words.`;

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
          <h2 className="text-xl font-bold text-foreground">Movie Reviews</h2>
          {selectedMovie ? (
            <p className="text-muted-foreground text-sm">
              Reviews for {selectedMovie.title}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Select a movie to view and generate reviews
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

              {/* Existing Reviews */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-foreground">
                  User Reviews
                </h4>
                {reviews.length > 0 ? (
                  reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="bg-muted rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-muted-foreground">
                          {review.author}
                        </span>
                        {review.author_details?.rating && (
                          <span className="text-accent text-sm">
                            ★ {review.author_details.rating}/10
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {review.content.length > 500
                          ? review.content.substring(0, 500) + "..."
                          : review.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground italic">
                    No user reviews available
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">🎬</p>
                <p>Select a movie from the browser to view reviews</p>
                <p className="text-sm mt-2">
                  Try asking the AI to search for movies or show popular films
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
