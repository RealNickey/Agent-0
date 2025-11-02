/**
 * Supabase Server Client for API routes and server-side operations
 * Use this in API routes and server components
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file."
  );
}

/**
 * Server-side Supabase client with service role key
 * This bypasses Row Level Security (RLS) - use with caution
 */
export const supabaseServer = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Helper function to assert Supabase environment is configured
 */
export function assertSupabaseEnv() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Supabase environment variables not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
}
