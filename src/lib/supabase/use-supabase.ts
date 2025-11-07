/**
 * React Hook for Supabase with Clerk Authentication
 * Provides an authenticated Supabase client in React components
 */
"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Hook to get an authenticated Supabase client
 * Automatically updates when Clerk authentication state changes
 * 
 * @returns Object containing:
 *   - supabase: Authenticated Supabase client (or unauthenticated if not signed in)
 *   - isLoading: Whether authentication state is being loaded
 *   - isAuthenticated: Whether user is signed in
 *   - userId: Clerk user ID
 * 
 * @example
 * ```tsx
 * import { useSupabase } from "@/lib/supabase/use-supabase";
 * 
 * function MyComponent() {
 *   const { supabase, isAuthenticated, isLoading } = useSupabase();
 *   
 *   useEffect(() => {
 *     if (!isLoading && isAuthenticated) {
 *       supabase.from('conversations').select('*').then(console.log);
 *     }
 *   }, [isLoading, isAuthenticated]);
 * }
 * ```
 */
export function useSupabase() {
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { isSignedIn, user } = useUser();
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient<Database> | null>(null);

  useEffect(() => {
    async function initSupabase() {
      if (!authLoaded) return;

      if (isSignedIn) {
        // Get Clerk token for authenticated requests
        const token = await getToken({ template: "supabase" });
        
        // If no token (JWT template not configured), warn and use anon client
        if (!token) {
          console.warn(
            "⚠️ Clerk JWT template 'supabase' not found. Using anonymous client.\n" +
            "To fix: Configure Clerk JWT template at https://dashboard.clerk.com\n" +
            "1. Go to JWT Templates\n" +
            "2. Click 'New template'\n" +
            "3. Select 'Supabase'\n" +
            "4. Name it 'supabase'\n" +
            "5. Save and refresh your app"
          );
          
          // Fallback to anon client (won't work with RLS policies)
          const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          });
          setSupabaseClient(client);
          return;
        }
        
        const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        
        setSupabaseClient(client);
      } else {
        // Create unauthenticated client for anonymous access
        const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        
        setSupabaseClient(client);
      }
    }

    initSupabase();
  }, [authLoaded, isSignedIn, getToken]);

  return {
    supabase: supabaseClient,
    isLoading: !authLoaded || supabaseClient === null,
    isAuthenticated: isSignedIn || false,
    userId: user?.id || null,
    user,
  };
}

/**
 * Hook to get the current user's Supabase database record
 * Automatically fetches and syncs the user record from the database
 * 
 * @returns Object containing:
 *   - supabaseUser: User record from Supabase database
 *   - isLoading: Whether user data is being fetched
 *   - error: Any error that occurred
 *   - refetch: Function to manually refetch user data
 * 
 * @example
 * ```tsx
 * import { useSupabaseUser } from "@/lib/supabase/use-supabase";
 * 
 * function UserProfile() {
 *   const { supabaseUser, isLoading } = useSupabaseUser();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   
 *   return <div>Welcome, {supabaseUser?.name}</div>;
 * }
 * ```
 */
export function useSupabaseUser() {
  const { supabase, isAuthenticated, userId } = useSupabase();
  const { user: clerkUser } = useUser();
  const [supabaseUser, setSupabaseUser] = useState<Database["public"]["Tables"]["users"]["Row"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = async () => {
    // Only proceed if we have authentication and a ready supabase client
    if (!isAuthenticated || !userId) {
      setSupabaseUser(null);
      setIsLoading(false);
      return;
    }

    // Wait for supabase client to be ready
    if (!supabase) {
      // Don't set loading to false yet, wait for client
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Try to get existing user
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_user_id", userId)
        .maybeSingle();

      if (fetchError) {
        console.error("Supabase query error:", fetchError);
        
        // Check if this is an RLS policy error (means JWT template not configured)
        const errorMessage = fetchError.message || fetchError.toString?.() || "Unknown error";
        if (errorMessage.includes("key") || errorMessage.includes("JWT") || errorMessage.includes("policy")) {
          throw new Error(
            "Authentication not properly configured. Please set up Clerk JWT template 'supabase' in your Clerk Dashboard."
          );
        }
        
        throw new Error(`Database error: ${errorMessage}`);
      }

      if (existingUser) {
        setSupabaseUser(existingUser);
      } else {
        // User doesn't exist, create via API route
        try {
          const response = await fetch("/api/db/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clerk_user_id: userId,
              email: clerkUser?.emailAddresses?.[0]?.emailAddress,
              name: clerkUser?.fullName || clerkUser?.firstName || null,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to create user: ${errorData.error || response.statusText}`);
          }

          const { user: newUser } = await response.json();
          setSupabaseUser(newUser);
        } catch (apiErr) {
          console.error("API error creating user:", apiErr);
          throw apiErr;
        }
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || "Unknown error occurred";
      console.error("Error in fetchUser:", errorMessage, err);
      setError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userId, supabase]);

  return {
    supabaseUser,
    isLoading,
    error,
    refetch: fetchUser,
  };
}
