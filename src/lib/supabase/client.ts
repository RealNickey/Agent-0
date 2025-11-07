/**
 * Supabase Client for client-side operations
 * Use this in React components and client-side code
 * Integrates with Clerk authentication for RLS policies
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file."
  );
}

/**
 * Client-side Supabase instance
 * This client respects Row Level Security (RLS) policies
 * Use with Clerk's session token for authenticated requests
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Clerk handles session persistence
    autoRefreshToken: false, // Clerk handles token refresh
  },
});

/**
 * Get Supabase client with Clerk authentication token
 * Use this function to create an authenticated client for RLS-protected operations
 * 
 * @param clerkToken - Clerk session token from useAuth() or getToken()
 * @returns Authenticated Supabase client
 * 
 * @example
 * ```tsx
 * import { useAuth } from "@clerk/nextjs";
 * import { getAuthenticatedClient } from "@/lib/supabase/client";
 * 
 * function MyComponent() {
 *   const { getToken } = useAuth();
 *   
 *   async function fetchData() {
 *     const token = await getToken({ template: "supabase" });
 *     const client = getAuthenticatedClient(token);
 *     const { data } = await client.from('users').select('*');
 *   }
 * }
 * ```
 */
export function getAuthenticatedClient(clerkToken: string | null) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
