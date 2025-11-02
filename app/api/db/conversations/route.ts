/**
 * Conversations API Route
 * Handles CRUD operations for conversations
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, assertSupabaseEnv } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/db/conversations
 * Get conversations for a user
 */
export async function GET(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const conversationId = searchParams.get("id");

    if (conversationId) {
      // Get specific conversation
      const { data, error } = await supabaseServer
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Conversation not found" },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json({ conversation: data });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Get all conversations for user
    const { data, error } = await supabaseServer
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ conversations: data });
  } catch (err: any) {
    console.error("Get conversations error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/db/conversations
 * Create a new conversation
 */
export async function POST(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const body = await req.json();
    const { user_id, title, metadata } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("conversations")
      .insert({
        user_id,
        title: title || null,
        metadata: metadata || null,
      } as any)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ conversation: data }, { status: 201 });
  } catch (err: any) {
    console.error("Create conversation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create conversation" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/db/conversations
 * Update a conversation
 */
export async function PATCH(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const body = await req.json();
    const { id, title, metadata } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (metadata !== undefined) updateData.metadata = metadata;

    const { data, error } = await supabaseServer
      .from("conversations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ conversation: data });
  } catch (err: any) {
    console.error("Update conversation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update conversation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/db/conversations
 * Delete a conversation
 */
export async function DELETE(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("conversations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Delete conversation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
