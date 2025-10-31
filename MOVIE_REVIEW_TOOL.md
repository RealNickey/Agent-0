# Movie Browser Tool - Streamlined TMDb Integration

## Overview

The Movie Browser Tool is a streamlined, AI-powered movie discovery platform that integrates with The Movie Database (TMDb) API and Google's Gemini AI. This tool focuses on core functionality:

- 🔍 **Search for movies** by title or keywords
- 🎬 **View detailed movie information** including cast, crew, and ratings
- 🤖 **AI-powered assistance** for natural language movie queries

## Features

### Essential AI Tools

The tool includes two core AI function declarations:

1. **search_movies** - Search for movies by title or keywords
2. **get_movie_details** - Get detailed information about specific movies

### Clean Interface

- **Single-view layout**: Streamlined movie grid and details view
- **Real-time AI interaction**: Voice and text communication with Gemini
- **Visual movie cards**: Clean display with posters, ratings, and details
- **Responsive design**: Works on desktop and mobile devices

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

The tool is integrated into the project:

1. Set up your environment variables
2. Run the development server: `npm run dev`
3. Navigate to: `http://localhost:3000/dashboard`
4. Click the "🎬 Movie Browser" button

## Usage

### Voice Commands

Interact with the AI using natural language:

- _"Search for Tom Hanks movies"_
- _"Tell me about Inception"_
- _"Find sci-fi movies from 2023"_

### Interface Navigation

1. **Search**: Ask the AI to search for specific movies
2. **View Details**: Click any movie card to see detailed information
3. **Voice Interaction**: Use the microphone for hands-free browsing

## Technical Architecture

### Components

- **MovieBrowser**: Main component with AI integration and UI
- **MovieCard**: Reusable movie display component
- **MovieDetails**: Detailed movie information view

### API Endpoints (Streamlined)

- `/api/movies/search` - Movie search
- `/api/movies/[id]` - Movie details

### Data Flow

1. User interacts with AI via voice/text
2. AI uses tool functions to query TMDb API
3. Results update the interface automatically
4. User can browse movies and view details

## Code Quality Features

- **TypeScript**: Full type safety throughout
- **Error Handling**: Graceful degradation for API failures
- **Loading States**: Visual feedback during data fetching
- **Responsive Design**: Mobile-friendly interface
- **Performance**: Optimized with proper React patterns

## Example Interactions

### Search Movies

```
User: "Find movies with Ryan Gosling"
AI: [Uses search_movies with "Ryan Gosling" query]
```

### View Details

```
User: "Tell me about Blade Runner 2049"
AI: [Searches for movie, then shows details using get_movie_details]
```

## Performance Benefits

### Reduced Complexity

- **2 core functions** instead of 5+ complex tools
- **Single component** instead of multiple UI pieces
- **Essential API routes** only (2 instead of 6+)

### Improved Efficiency

- **Faster load times** with streamlined code
- **Better maintainability** with focused functionality
- **Cleaner AI interactions** with simplified tool set

## Customization

### Adding Features

To extend functionality:

1. Add new function declaration in `movie-browser.tsx`
2. Create corresponding API endpoint
3. Handle the tool call in the `onToolCall` function

### Styling

Uses Tailwind CSS for easy customization of:

- Color schemes
- Layout responsiveness
- Component spacing
- Typography

## Contributing

When contributing:

1. Maintain the streamlined approach
2. Focus on core movie functionality
3. Ensure TypeScript compliance
4. Test AI interactions thoroughly
5. Keep the interface clean and intuitive

## License

This tool follows the same license as the main project (Apache 2.0).
