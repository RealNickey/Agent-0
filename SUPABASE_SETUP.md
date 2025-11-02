# Supabase Database Setup

This document describes the Supabase database integration for the AI Agent application.

## Overview

The application uses Supabase as its database solution to provide persistent storage for:
- User profiles
- Conversation history
- Messages
- Favorite movies
- Movie watchlist

## Database Schema

### Tables

#### `users`
Stores user profile information.
- `id` (UUID, PK): Unique user identifier
- `clerk_user_id` (TEXT, UNIQUE): Clerk authentication ID
- `email` (TEXT): User email
- `name` (TEXT): User display name
- `created_at` (TIMESTAMPTZ): Account creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp
- `preferences` (JSONB): User preferences and settings

#### `conversations`
Stores conversation sessions between users and the AI.
- `id` (UUID, PK): Unique conversation identifier
- `user_id` (UUID, FK): Reference to users table
- `title` (TEXT): Conversation title
- `created_at` (TIMESTAMPTZ): Conversation creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp
- `metadata` (JSONB): Additional conversation metadata

#### `messages`
Stores individual messages within conversations.
- `id` (UUID, PK): Unique message identifier
- `conversation_id` (UUID, FK): Reference to conversations table
- `role` (TEXT): Message role (user, assistant, system)
- `content` (TEXT): Message content
- `created_at` (TIMESTAMPTZ): Message timestamp
- `metadata` (JSONB): Additional message metadata (e.g., tool calls, attachments)

#### `favorites`
Stores user's favorite movies.
- `id` (UUID, PK): Unique favorite identifier
- `user_id` (UUID, FK): Reference to users table
- `movie_id` (INTEGER): TMDb movie ID
- `movie_title` (TEXT): Movie title
- `movie_poster` (TEXT): Poster image URL
- `created_at` (TIMESTAMPTZ): Timestamp when added to favorites
- `metadata` (JSONB): Additional movie metadata

#### `watchlist`
Stores user's movie watchlist.
- `id` (UUID, PK): Unique watchlist identifier
- `user_id` (UUID, FK): Reference to users table
- `movie_id` (INTEGER): TMDb movie ID
- `movie_title` (TEXT): Movie title
- `movie_poster` (TEXT): Poster image URL
- `created_at` (TIMESTAMPTZ): Timestamp when added to watchlist
- `watched` (BOOLEAN): Whether the movie has been watched
- `watched_at` (TIMESTAMPTZ): Timestamp when marked as watched
- `metadata` (JSONB): Additional movie metadata

## Setup Instructions

### 1. Run Database Migration

You need to run the SQL migration file to create all the tables and policies in your Supabase project.

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Navigate to the SQL Editor
4. Copy the contents of `supabase/migrations/20250102_initial_schema.sql`
5. Paste it into the SQL Editor and click "Run"

The migration will:
- Create all necessary tables
- Set up indexes for performance
- Configure Row Level Security (RLS) policies
- Create triggers for automatic timestamp updates

### 2. Verify Environment Variables

Ensure these variables are set in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL='your-project-url'
NEXT_PUBLIC_SUPABASE_ANON_KEY='your-anon-key'
SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'
```

## API Routes

All database API routes are located in `app/api/db/`:

### Users API (`/api/db/users`)
- `GET` - Get users or a specific user by clerk_user_id
  - Query params: `clerk_user_id` (optional)
- `POST` - Create a new user
  - Body: `{ clerk_user_id, email, name, preferences }`
- `PATCH` - Update user information
  - Body: `{ clerk_user_id, email?, name?, preferences? }`
- `DELETE` - Delete a user
  - Query params: `clerk_user_id` (required)

### Conversations API (`/api/db/conversations`)
- `GET` - Get conversations for a user or a specific conversation
  - Query params: `user_id` (required) or `id` (optional)
- `POST` - Create a new conversation
  - Body: `{ user_id, title?, metadata? }`
- `PATCH` - Update a conversation
  - Body: `{ id, title?, metadata? }`
- `DELETE` - Delete a conversation
  - Query params: `id` (required)

### Messages API (`/api/db/messages`)
- `GET` - Get messages for a conversation
  - Query params: `conversation_id` (required), `limit` (optional, default 100)
- `POST` - Create a new message
  - Body: `{ conversation_id, role, content, metadata? }`
- `DELETE` - Delete a message
  - Query params: `id` (required)

### Favorites API (`/api/db/favorites`)
- `GET` - Get user's favorite movies
  - Query params: `user_id` (required)
- `POST` - Add a movie to favorites
  - Body: `{ user_id, movie_id, movie_title, movie_poster?, metadata? }`
- `DELETE` - Remove a movie from favorites
  - Query params: `id` (required) OR `user_id` + `movie_id`

### Watchlist API (`/api/db/watchlist`)
- `GET` - Get user's movie watchlist
  - Query params: `user_id` (required), `watched` (optional, true/false)
- `POST` - Add a movie to watchlist
  - Body: `{ user_id, movie_id, movie_title, movie_poster?, metadata? }`
- `PATCH` - Update watchlist entry (mark as watched)
  - Body: `{ id, watched?, metadata? }`
- `DELETE` - Remove a movie from watchlist
  - Query params: `id` (required) OR `user_id` + `movie_id`

### Health Check API (`/api/db/health`)
- `GET` - Check database connection health

## Testing the API

### Using PowerShell (curl equivalent)

#### 1. Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/db/health" -Method Get
```

#### 2. Create a User
```powershell
$body = @{
    clerk_user_id = "test_user_123"
    email = "test@example.com"
    name = "Test User"
    preferences = @{
        theme = "dark"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/db/users" -Method Post -Body $body -ContentType "application/json"
```

#### 3. Get User
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/db/users?clerk_user_id=test_user_123" -Method Get
```

#### 4. Create a Conversation
```powershell
$body = @{
    user_id = "user-uuid-here"
    title = "Test Conversation"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/db/conversations" -Method Post -Body $body -ContentType "application/json"
```

#### 5. Create a Message
```powershell
$body = @{
    conversation_id = "conversation-uuid-here"
    role = "user"
    content = "Hello, AI!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/db/messages" -Method Post -Body $body -ContentType "application/json"
```

#### 6. Add to Favorites
```powershell
$body = @{
    user_id = "user-uuid-here"
    movie_id = 550
    movie_title = "Fight Club"
    movie_poster = "/path/to/poster.jpg"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/db/favorites" -Method Post -Body $body -ContentType "application/json"
```

#### 7. Add to Watchlist
```powershell
$body = @{
    user_id = "user-uuid-here"
    movie_id = 680
    movie_title = "Pulp Fiction"
    movie_poster = "/path/to/poster.jpg"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/db/watchlist" -Method Post -Body $body -ContentType "application/json"
```

## Security

- **Row Level Security (RLS)**: All tables have RLS enabled to ensure users can only access their own data
- **Service Role Key**: API routes use the service role key to bypass RLS for administrative operations
- **Client-side Access**: For client-side operations, use the client Supabase instance with the anon key

## Client vs Server Usage

### Server-side (API Routes)
```typescript
import { supabaseServer } from "@/lib/supabase/server";

// Use in API routes
const { data, error } = await supabaseServer
  .from("users")
  .select("*");
```

### Client-side (React Components)
```typescript
import { supabase } from "@/lib/supabase/client";

// Use in React components
const { data, error } = await supabase
  .from("users")
  .select("*");
```

## Next Steps

1. **Integrate with UI**: Connect the existing React components to use these API routes
2. **Add Authentication Context**: Create hooks to manage user sessions and automatically include user_id
3. **Real-time Subscriptions**: Use Supabase real-time features for live updates
4. **Optimize Queries**: Add proper indexes and optimize queries based on usage patterns
5. **Add Caching**: Implement caching strategies for frequently accessed data
6. **Error Handling**: Enhance error handling and user feedback in the UI

## Troubleshooting

### Connection Issues
- Verify environment variables are correctly set
- Check Supabase project status in dashboard
- Ensure API routes are not cached inappropriately

### Type Errors
- The type definitions are in `src/lib/supabase/database.types.ts`
- You can regenerate types using the Supabase CLI if schema changes

### RLS Policies
- If you get permission errors, check the RLS policies in Supabase dashboard
- Ensure the JWT claims are being passed correctly
