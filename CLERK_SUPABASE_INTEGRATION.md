# Clerk + Supabase Integration Guide

This document explains how Clerk authentication is integrated with Supabase Row Level Security (RLS) in the Agent-0 project.

## Overview

The application uses **Clerk** for user authentication and **Supabase** for database storage. These are integrated so that:

1. Users authenticate through Clerk
2. Clerk provides JWT tokens with user identity
3. Supabase RLS policies use these tokens to enforce data access rules
4. Each user can only access their own data

## Architecture

```
User Login (Clerk)
    ↓
JWT Token (contains user ID)
    ↓
Supabase Client (with token)
    ↓
RLS Policies (validate token)
    ↓
Database Access (user's data only)
```

## Client Configuration

### 1. Frontend (React Components)

Use the `useSupabase` hook for authenticated database access:

```tsx
import { useSupabase } from "@/lib/supabase/use-supabase";

function MyComponent() {
  const { supabase, isAuthenticated, isLoading } = useSupabase();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // This query will only return conversations for the current user
      supabase
        .from('conversations')
        .select('*')
        .then(({ data }) => console.log(data));
    }
  }, [isAuthenticated, isLoading]);
}
```

### 2. Get User Database Record

Use `useSupabaseUser` to automatically fetch the user's database record:

```tsx
import { useSupabaseUser } from "@/lib/supabase/use-supabase";

function UserProfile() {
  const { supabaseUser, isLoading } = useSupabaseUser();

  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Welcome, {supabaseUser?.name}</h1>
      <p>Email: {supabaseUser?.email}</p>
    </div>
  );
}
```

### 3. Backend (API Routes)

Use `getAuthenticatedSupabaseClient` for RLS-protected operations:

```typescript
import { getAuthenticatedSupabaseClient, getCurrentUserId } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Get authenticated client (respects RLS)
  const supabase = await getAuthenticatedSupabaseClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // This will only return data the user has access to
  const { data, error } = await supabase
    .from('conversations')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversations: data });
}
```

For admin operations that need to bypass RLS:

```typescript
import { supabaseAdmin, getOrCreateUser } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Admin operation - bypasses RLS
  const { data } = await supabaseAdmin
    .from('users')
    .select('*');
    
  // Get or create user (common pattern for user setup)
  const user = await getOrCreateUser('clerk_user_123', {
    email: 'user@example.com',
    name: 'John Doe'
  });
  
  return NextResponse.json({ user });
}
```

## Row Level Security (RLS) Policies

The database has RLS policies that use Clerk's JWT tokens to enforce access control.

### How It Works

1. **JWT Claims**: Clerk tokens contain the user ID in the `sub` claim
2. **RLS Policies**: Supabase policies extract this ID from `current_setting('request.jwt.claims')`
3. **Data Filtering**: Queries are automatically filtered to the user's data

### Example Policy

```sql
-- Users can only view their own conversations
CREATE POLICY "Users can view their own conversations"
    ON conversations FOR SELECT
    USING (user_id IN (
        SELECT id FROM users 
        WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ));
```

## Setting Up Clerk JWT Template

⚠️ **IMPORTANT**: You must configure a JWT template in Clerk for this to work!

### Steps:

1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Select your application
3. Navigate to: **JWT Templates**
4. Click **New Template**
5. Choose **Supabase** template
6. Name it: `supabase` (exactly this name!)
7. Save the template

The template should include these claims:
```json
{
  "sub": "{{user.id}}"
}
```

## User Flow

### 1. User Signs Up/In with Clerk

```tsx
import { SignIn, SignUp } from "@clerk/nextjs";

function AuthPage() {
  return <SignIn />;
}
```

### 2. Create Supabase User Record

When a user first signs in, create their database record:

```typescript
// This happens automatically with useSupabaseUser hook
// Or manually in an API route:

import { getOrCreateUser, getCurrentUserId } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const clerkUserId = await getCurrentUserId();
  
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const user = await getOrCreateUser(clerkUserId, {
    email: 'user@example.com',
    name: 'John Doe'
  });
  
  return NextResponse.json({ user });
}
```

### 3. Access User Data

Once the user record exists, they can access their data:

```tsx
import { useSupabase } from "@/lib/supabase/use-supabase";

function Dashboard() {
  const { supabase, isAuthenticated } = useSupabase();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch user's conversations (RLS ensures only their data is returned)
      supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .then(({ data }) => setConversations(data || []));
    }
  }, [isAuthenticated]);

  return (
    <div>
      {conversations.map(conv => (
        <div key={conv.id}>{conv.title}</div>
      ))}
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Create Conversation for User

```typescript
import { useSupabase, useSupabaseUser } from "@/lib/supabase/use-supabase";

function CreateConversation() {
  const { supabase } = useSupabase();
  const { supabaseUser } = useSupabaseUser();

  const createConversation = async () => {
    if (!supabaseUser) return;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: supabaseUser.id,
        title: 'New Conversation',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return;
    }

    console.log('Created conversation:', data);
  };

  return <button onClick={createConversation}>New Chat</button>;
}
```

### Pattern 2: Add Message to Conversation

```typescript
async function addMessage(conversationId: string, content: string) {
  const { supabase } = useSupabase();

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content: content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding message:', error);
    return;
  }

  return data;
}
```

### Pattern 3: Add Movie to Favorites

```typescript
import { useSupabase, useSupabaseUser } from "@/lib/supabase/use-supabase";

function AddToFavorites({ movieId, movieTitle, posterPath }) {
  const { supabase } = useSupabase();
  const { supabaseUser } = useSupabaseUser();

  const addFavorite = async () => {
    if (!supabaseUser) return;

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: supabaseUser.id,
        movie_id: movieId,
        movie_title: movieTitle,
        movie_poster: posterPath,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation - already in favorites
        console.log('Already in favorites');
      } else {
        console.error('Error adding favorite:', error);
      }
      return;
    }

    console.log('Added to favorites:', data);
  };

  return <button onClick={addFavorite}>❤️ Favorite</button>;
}
```

## Testing RLS Policies

### Test 1: Verify User Isolation

1. Create two test users in Clerk
2. Sign in as User A
3. Create some conversations
4. Sign out and sign in as User B
5. Verify User B cannot see User A's conversations

### Test 2: API Route with RLS

```typescript
// Test that authenticated client respects RLS
import { getAuthenticatedSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await getAuthenticatedSupabaseClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // This should only return the current user's conversations
  const { data } = await supabase
    .from('conversations')
    .select('*, messages(count)');

  return NextResponse.json({ conversations: data });
}
```

## Troubleshooting

### Issue: "JWT template not found"

**Solution**: Create a JWT template named `supabase` in Clerk Dashboard

### Issue: "RLS policy violation"

**Solution**: Ensure the JWT token is being passed correctly:

```typescript
const token = await getToken({ template: "supabase" });
console.log('Token:', token); // Should not be null
```

### Issue: "User record not found"

**Solution**: Ensure user is created in Supabase when they sign up:

```typescript
const { supabaseUser } = useSupabaseUser(); // Auto-creates if not exists
```

### Issue: "Can't access other users' data"

**Solution**: This is correct behavior! RLS is working. Use admin client if needed:

```typescript
import { supabaseAdmin } from "@/lib/supabase/server";

// Admin access (use carefully!)
const { data } = await supabaseAdmin.from('users').select('*');
```

## Security Best Practices

1. **Never use admin client in frontend** - Only use in secure API routes
2. **Always validate user permissions** - Even with RLS, validate in your code
3. **Use authenticated client by default** - Only use admin when absolutely necessary
4. **Log security events** - Track when admin access is used
5. **Rotate keys regularly** - Update Supabase keys periodically

## Summary

- ✅ Use `useSupabase()` hook in React components
- ✅ Use `getAuthenticatedSupabaseClient()` in API routes
- ✅ RLS policies automatically enforce user data isolation
- ✅ Admin client (`supabaseAdmin`) bypasses RLS - use carefully
- ✅ JWT template named `supabase` must be configured in Clerk
- ✅ User records auto-created via `useSupabaseUser()` hook

Your application now has a secure, authenticated database layer! 🎉
