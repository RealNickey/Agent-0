/**
 * Favorites API Route
 * Handles CRUD operations for user's favorite movies
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, assertSupabaseEnv } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/db/favorites
 * Get favorites for a user
 */
export async function GET(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Get all favorites for user
    const { data, error } = await supabaseServer
      .from("favorites")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ favorites: data });
  } catch (err: any) {
    console.error("Get favorites error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/db/favorites
 * Add a movie to favorites
 */
export async function POST(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const body = await req.json();
    const { user_id, movie_id, movie_title, movie_poster, metadata } = body;

    if (!user_id || !movie_id || !movie_title) {
      return NextResponse.json(
        { error: "user_id, movie_id, and movie_title are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("favorites")
      .insert({
        user_id,
        movie_id,
        movie_title,
        movie_poster: movie_poster || null,
        metadata: metadata || null,
      } as any)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          { error: "Movie already in favorites" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ favorite: data }, { status: 201 });
  } catch (err: any) {
    console.error("Create favorite error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to add to favorites" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/db/favorites
 * Remove a movie from favorites
 */
export async function DELETE(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const movieId = searchParams.get("movie_id");
    const id = searchParams.get("id");

    if (id) {
      // Delete by favorite ID
      const { error } = await supabaseServer
        .from("favorites")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } else if (userId && movieId) {
      // Delete by user_id and movie_id
      const { error } = await supabaseServer
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("movie_id", Number(movieId));

      if (error) throw error;
    } else {
      return NextResponse.json(
        { error: "Either id or both user_id and movie_id are required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Delete favorite error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to remove from favorites" },
      { status: 500 }
    );
  }
}
