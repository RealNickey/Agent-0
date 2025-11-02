/**
 * Database TypeScript types
 * These types represent the database schema and provide type safety
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_user_id: string | null;
          email: string | null;
          name: string | null;
          created_at: string;
          updated_at: string;
          preferences: Json | null;
        };
        Insert: {
          id?: string;
          clerk_user_id?: string | null;
          email?: string | null;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
          preferences?: Json | null;
        };
        Update: {
          id?: string;
          clerk_user_id?: string | null;
          email?: string | null;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
          preferences?: Json | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          created_at?: string;
          metadata?: Json | null;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          movie_id: number;
          movie_title: string;
          movie_poster: string | null;
          created_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          movie_id: number;
          movie_title: string;
          movie_poster?: string | null;
          created_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          movie_id?: number;
          movie_title?: string;
          movie_poster?: string | null;
          created_at?: string;
          metadata?: Json | null;
        };
      };
      watchlist: {
        Row: {
          id: string;
          user_id: string;
          movie_id: number;
          movie_title: string;
          movie_poster: string | null;
          created_at: string;
          watched: boolean;
          watched_at: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          movie_id: number;
          movie_title: string;
          movie_poster?: string | null;
          created_at?: string;
          watched?: boolean;
          watched_at?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          movie_id?: number;
          movie_title?: string;
          movie_poster?: string | null;
          created_at?: string;
          watched?: boolean;
          watched_at?: string | null;
          metadata?: Json | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
