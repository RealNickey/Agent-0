/**
 * Messages API Route
 * Handles CRUD operations for messages
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, assertSupabaseEnv } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/db/messages
 * Get messages for a conversation
 */
export async function GET(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversation_id");
    const messageId = searchParams.get("id");
    const limit = Math.min(
      Number(searchParams.get("limit") || "100"),
      1000
    );

    if (messageId) {
      // Get specific message
      const { data, error } = await supabaseServer
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Message not found" },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json({ message: data });
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversation_id is required" },
        { status: 400 }
      );
    }

    // Get all messages for conversation
    const { data, error } = await supabaseServer
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ messages: data });
  } catch (err: any) {
    console.error("Get messages error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/db/messages
 * Create a new message
 */
export async function POST(req: NextRequest) {
  try {
    assertSupabaseEnv();
    const body = await req.json();
    const { conversation_id, role, content, metadata } = body;

    if (!conversation_id || !role || !content) {
      return NextResponse.json(
        { error: "conversation_id, role, and content are required" },
        { status: 400 }
      );
    }

    if (!["user", "assistant", "system"].includes(role)) {
      return NextResponse.json(
        { error: "role must be one of: user, assistant, system" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("messages")
      .insert({
        conversation_id,
        role,
        content,
        metadata: metadata || null,
      } as any)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (err: any) {
    console.error("Create message error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create message" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/db/messages
 * Delete a message
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
      .from("messages")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Delete message error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete message" },
      { status: 500 }
    );
  }
}
