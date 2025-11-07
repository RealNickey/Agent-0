/**
 * Supabase Server Client for API routes and server-side operations
 * Use this in API routes and server components
 * Provides both admin and user-scoped clients for different use cases
 */
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file."
  );
}

/**
 * Admin Supabase client with service role key
 * ⚠️ BYPASSES Row Level Security (RLS) - use with caution!
 * 
 * Use cases:
 * - Admin operations that need full database access
 * - Background jobs and maintenance tasks
 * - Operations that need to read/write across all users
 * 
 * @example
 * ```ts
 * import { supabaseAdmin } from "@/lib/supabase/server";
 * 
 * // Admin operation - bypasses RLS
 * const { data } = await supabaseAdmin.from('users').select('*');
 * ```
 */
export const supabaseAdmin = createClient<Database>(
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
 * Get an authenticated Supabase client for the current user
 * Uses Clerk authentication to enforce RLS policies
 * 
 * This is the RECOMMENDED way to access Supabase in API routes
 * as it respects RLS policies and user permissions
 * 
 * @returns Promise<Supabase client with user context> or null if not authenticated
 * 
 * @example
 * ```ts
 * import { getAuthenticatedSupabaseClient } from "@/lib/supabase/server";
 * 
 * export async function GET(req: NextRequest) {
 *   const supabase = await getAuthenticatedSupabaseClient();
 *   
 *   if (!supabase) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   
 *   // This will only return data the user has access to (RLS enforced)
 *   const { data } = await supabase.from('conversations').select('*');
 *   return NextResponse.json({ data });
 * }
 * ```
 */
export async function getAuthenticatedSupabaseClient() {
  const { getToken } = await auth();
  const token = await getToken({ template: "supabase" });

  if (!token) {
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
}

/**
 * Get the current user's ID from Clerk
 * Returns the Clerk user ID (not the Supabase users table ID)
 * 
 * @returns Promise<string | null> - Clerk user ID or null if not authenticated
 * 
 * @example
 * ```ts
 * const clerkUserId = await getCurrentUserId();
 * if (!clerkUserId) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * ```
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Get or create a Supabase user record for the current Clerk user
 * This ensures a corresponding record exists in the users table
 * 
 * @param clerkUserId - Clerk user ID
 * @param userData - Optional user data (email, name)
 * @returns Promise<User record from Supabase>
 * 
 * @example
 * ```ts
 * const clerkUserId = await getCurrentUserId();
 * if (clerkUserId) {
 *   const supabaseUser = await getOrCreateUser(clerkUserId, {
 *     email: 'user@example.com',
 *     name: 'John Doe'
 *   });
 * }
 * ```
 */
export async function getOrCreateUser(
  clerkUserId: string,
  userData?: { email?: string; name?: string }
) {
  // First, try to get existing user
  const { data: existingUser, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (existingUser) {
    return existingUser;
  }

  // User doesn't exist, create new record
  const { data: newUser, error: createError } = await supabaseAdmin
    .from("users")
    .insert({
      clerk_user_id: clerkUserId,
      email: userData?.email || null,
      name: userData?.name || null,
    } as any)
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create user: ${createError.message}`);
  }

  return newUser;
}

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

// Keep backward compatibility with existing code
export const supabaseServer = supabaseAdmin;
