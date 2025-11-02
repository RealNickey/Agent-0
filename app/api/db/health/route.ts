/**
 * Database Health Check API Route
 * Tests the Supabase connection
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/db/health
 * Check if database connection is healthy
 */
export async function GET(req: NextRequest) {
  try {
    // Try to query the users table (just count, doesn't return data)
    const { count, error } = await supabaseServer
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      database: "supabase",
      timestamp: new Date().toISOString(),
      tables: {
        users: count !== null ? `${count} records` : "accessible",
      },
    });
  } catch (err: any) {
    console.error("Database health check error:", err);
    return NextResponse.json(
      {
        status: "error",
        message: err.message || "Database connection failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
