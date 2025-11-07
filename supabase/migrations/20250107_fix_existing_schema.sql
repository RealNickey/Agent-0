-- Migration: Fix existing schema and ensure all objects exist
-- Description: Safely handles existing triggers and ensures complete schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE,
    email TEXT,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    preferences JSONB DEFAULT '{}'::jsonb
);

-- Create index on clerk_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for faster message retrieval
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL,
    movie_title TEXT NOT NULL,
    movie_poster TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, movie_id)
);

-- Create indexes for favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL,
    movie_title TEXT NOT NULL,
    movie_poster TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    watched BOOLEAN DEFAULT FALSE,
    watched_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, movie_id)
);

-- Create indexes for watchlist
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_watched ON watchlist(watched);
CREATE INDEX IF NOT EXISTS idx_watchlist_created_at ON watchlist(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (to avoid "already exists" error)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;

-- Recreate triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can create their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view their own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can create their own watchlist items" ON watchlist;
DROP POLICY IF EXISTS "Users can update their own watchlist items" ON watchlist;
DROP POLICY IF EXISTS "Users can delete their own watchlist items" ON watchlist;

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
    ON conversations FOR SELECT
    USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ));

CREATE POLICY "Users can create their own conversations"
    ON conversations FOR INSERT
    WITH CHECK (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ));

CREATE POLICY "Users can update their own conversations"
    ON conversations FOR UPDATE
    USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ));

CREATE POLICY "Users can delete their own conversations"
    ON conversations FOR DELETE
    USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ));

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    USING (conversation_id IN (
        SELECT c.id FROM conversations c
        JOIN users u ON c.user_id = u.id
        WHERE u.clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ));

CREATE POLICY "Users can create messages in their conversations"
    ON messages FOR INSERT
    WITH CHECK (conversation_id IN (
        SELECT c.id FROM conversations c
        JOIN users u ON c.user_id = u.id
        WHERE u.clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ));

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
    ON favorites FOR SELECT
    USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ));

CREATE POLICY "Users can create their own favorites"
    ON favorites FOR INSERT
    WITH CHECK (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ));

CREATE POLICY "Users can delete their own favorites"
    ON favorites FOR DELETE
    USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ));

-- Watchlist policies
CREATE POLICY "Users can view their own watchlist"
    ON watchlist FOR SELECT
    USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ));

CREATE POLICY "Users can create their own watchlist items"
    ON watchlist FOR INSERT
    WITH CHECK (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ));

CREATE POLICY "Users can update their own watchlist items"
    ON watchlist FOR UPDATE
    USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ));

CREATE POLICY "Users can delete their own watchlist items"
    ON watchlist FOR DELETE
    USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ));

-- Grant necessary permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
