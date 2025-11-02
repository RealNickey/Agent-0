/**
 * Watchlist API Route
 * Handles CRUD operations for user's movie watchlist
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, assertSupabaseEnv } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/db/watchlist
 * Get watchlist for a user
 */
export async function GET(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const watched = searchParams.get("watched");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    let query = supabaseServer
      .from("watchlist")
      .select("*")
      .eq("user_id", userId);

    // Filter by watched status if provided
    if (watched !== null) {
      query = query.eq("watched", watched === "true");
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ watchlist: data });
  } catch (err: any) {
    console.error("Get watchlist error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch watchlist" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/db/watchlist
 * Add a movie to watchlist
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
      .from("watchlist")
      .insert({
        user_id,
        movie_id,
        movie_title,
        movie_poster: movie_poster || null,
        watched: false,
        metadata: metadata || null,
      } as any)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          { error: "Movie already in watchlist" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ watchlist: data }, { status: 201 });
  } catch (err: any) {
    console.error("Create watchlist entry error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to add to watchlist" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/db/watchlist
 * Update a watchlist entry (e.g., mark as watched)
 */
export async function PATCH(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const body = await req.json();
    const { id, watched, metadata } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (watched !== undefined) {
      updateData.watched = watched;
      updateData.watched_at = watched ? new Date().toISOString() : null;
    }
    if (metadata !== undefined) updateData.metadata = metadata;

    const { data, error } = await supabaseServer
      .from("watchlist")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Watchlist entry not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ watchlist: data });
  } catch (err: any) {
    console.error("Update watchlist error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update watchlist" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/db/watchlist
 * Remove a movie from watchlist
 */
export async function DELETE(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const movieId = searchParams.get("movie_id");
    const id = searchParams.get("id");

    if (id) {
      // Delete by watchlist ID
      const { error } = await supabaseServer
        .from("watchlist")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } else if (userId && movieId) {
      // Delete by user_id and movie_id
      const { error } = await supabaseServer
        .from("watchlist")
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
    console.error("Delete watchlist entry error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to remove from watchlist" },
      { status: 500 }
    );
  }
}
