/**
 * Users API Route
 * Handles CRUD operations for users
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, assertSupabaseEnv } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export const dynamic = "force-dynamic";

/**
 * GET /api/db/users
 * Get all users (admin only) or get user by clerk_user_id
 */
export async function GET(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const { searchParams } = new URL(req.url);
    const clerkUserId = searchParams.get("clerk_user_id");

    if (clerkUserId) {
      // Get specific user by Clerk ID
      const { data, error } = await supabaseServer
        .from("users")
        .select("*")
        .eq("clerk_user_id", clerkUserId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json({ user: data });
    }

    // Get all users (for admin purposes)
    const { data, error } = await supabaseServer
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ users: data });
  } catch (err: any) {
    console.error("Get users error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/db/users
 * Create a new user
 */
export async function POST(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const body = await req.json();
    const { clerk_user_id, email, name, preferences } = body;

    if (!clerk_user_id) {
      return NextResponse.json(
        { error: "clerk_user_id is required" },
        { status: 400 }
      );
    }

    const insertData: UserInsert = {
      clerk_user_id,
      email,
      name,
      preferences,
    };

    const { data, error } = await supabaseServer
      .from("users")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          { error: "User already exists" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (err: any) {
    console.error("Create user error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/db/users
 * Update a user by clerk_user_id
 */
export async function PATCH(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const body = await req.json();
    const { clerk_user_id, email, name, preferences } = body;

    if (!clerk_user_id) {
      return NextResponse.json(
        { error: "clerk_user_id is required" },
        { status: 400 }
      );
    }

    const updateData: UserUpdate = {};
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (preferences !== undefined) updateData.preferences = preferences;

    const { data, error } = await supabaseServer
      .from("users")
      .update(updateData)
      .eq("clerk_user_id", clerk_user_id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ user: data });
  } catch (err: any) {
    console.error("Update user error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/db/users
 * Delete a user by clerk_user_id
 */
export async function DELETE(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const { searchParams } = new URL(req.url);
    const clerkUserId = searchParams.get("clerk_user_id");

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "clerk_user_id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("users")
      .delete()
      .eq("clerk_user_id", clerkUserId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Delete user error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
