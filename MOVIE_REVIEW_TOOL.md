# Movie Review Tool - TMDb Integration

## Overview

The Movie Review Tool is an AI-powered movie discovery and review platform that integrates with The Movie Database (TMDb) API and Google's Gemini AI. This tool allows users to:

- 🔍 **Search for movies** by title, year, or keywords
- 📊 **Browse popular and top-rated movies**
- 🎬 **View detailed movie information** including cast, crew, and user reviews
- 🤖 **Generate AI-powered movie reviews** using Google's Gemini
- 💡 **Get personalized movie recommendations**

## Features

### AI-Powered Tools
The tool includes several AI function declarations that allow the Gemini assistant to:

1. **search_movies** - Search for movies by title or keywords
2. **get_movie_details** - Get detailed information about specific movies
3. **get_popular_movies** - Fetch currently popular movies
4. **get_top_rated_movies** - Get top-rated movies of all time
5. **get_movie_recommendations** - Get recommendations based on a movie

### Interactive Interface
- **Dual-panel layout**: Movie browser on the left, reviews on the right
- **Real-time AI interaction**: Voice and text communication with Gemini
- **Visual movie cards**: Rich display with posters, ratings, and details
- **User reviews**: Access to community reviews from TMDb

## Setup

### Prerequisites
1. **TMDb API Key**: Get one from [TMDb API Settings](https://www.themoviedb.org/settings/api)
2. **Google Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com/apikey)

### Environment Configuration
Add these variables to your `.env.local` file:

```bash
# TMDb API (choose one)
TMDB_ACCESS_TOKEN=your_tmdb_v4_access_token_here
# OR
TMDB_API_KEY=your_tmdb_v3_api_key_here

# Google Gemini API
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

### Installation
The tool is already integrated into the project. Simply:

1. Set up your environment variables
2. Run the development server: `npm run dev`
3. Navigate to the dashboard: `http://localhost:3000/dashboard`
4. Click the "🎬 Movie Reviews" button to access the tool

## Usage

### Voice Commands
You can interact with the AI using natural language:

- *"Show me popular movies"*
- *"Search for movies with Tom Hanks"*
- *"Tell me about Inception"*
- *"Recommend movies similar to The Matrix"*
- *"Generate a review for this movie"*

### Interface Navigation
1. **Browse Movies**: Use the left panel to search and browse movies
2. **Select Movie**: Click on any movie to view details and reviews
3. **AI Reviews**: Click "Generate AI Review" for AI-powered analysis
4. **Voice Interaction**: Use the microphone to talk to the AI assistant

## Technical Architecture

### Components
- **TMDbTool**: Main tool component with AI function declarations
- **MovieReviewTool**: UI component with dual-panel layout
- **API Routes**: Next.js API routes for TMDb integration

### API Endpoints
- `/api/movies/search` - Movie search
- `/api/movies/popular` - Popular movies
- `/api/movies/top-rated` - Top-rated movies
- `/api/movies/[id]` - Movie details
- `/api/movies/[id]/reviews` - Movie reviews
- `/api/movies/[id]/recommendations` - Movie recommendations

### Data Flow
1. User interacts with AI via voice/text
2. AI uses tool functions to query TMDb API
3. Results are displayed in the interface
4. User can generate AI reviews for selected movies

## Example Interactions

### Search for Movies
```
User: "Find me some good sci-fi movies from 2023"
AI: [Uses search_movies tool with relevant parameters]
```

### Get Movie Details
```
User: "Tell me about Dune: Part Two"
AI: [Uses search_movies to find the movie, then get_movie_details for full info]
```

### Generate Reviews
```
User: "Write a review for this movie"
AI: [Analyzes movie data and generates comprehensive review]
```

## Customization

### Adding New Tools
To add new movie-related tools:

1. Define the function declaration in `tmdb-tool.tsx`
2. Add the API endpoint in `/app/api/movies/`
3. Handle the tool call in the `onToolCall` function

### Styling
The tool uses Tailwind CSS classes and can be customized by modifying the component styles.

## Troubleshooting

### Common Issues

1. **TMDb API Errors**: Check your API key and rate limits
2. **AI Not Responding**: Verify Gemini API key and connection
3. **Missing Movie Data**: Some movies may have limited information

### Debug Mode
Enable console logging by setting development mode to see API calls and responses.

## Contributing

When contributing to the Movie Review Tool:

1. Follow the existing code structure
2. Add proper TypeScript types
3. Include error handling
4. Test with various movie queries
5. Update documentation for new features

## License

This tool follows the same license as the main project (Apache 2.0).
