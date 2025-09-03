import { NextResponse } from "next/server";
import { pingTmdb, assertTmdbEnv } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    assertTmdbEnv();
    const ok = await pingTmdb();
    return NextResponse.json({ ok });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Ping failed", details: err?.details },
      { status: 500 }
    );
  }
}
