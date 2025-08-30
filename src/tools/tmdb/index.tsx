/**
 * TMDb Movie Tools - Main Export
 * Provides movie search, details, reviews, and AI-powered movie recommendations
 */

export { TMDbTool } from './tmdb-tool';
export { MovieReviewTool as TMDbMovieReview } from './movie-review-tool';

// Export the MovieReviewTool as the default component for easier integration
export { MovieReviewTool as default } from './movie-review-tool';
