import { NextRequest, NextResponse } from "next/server";
import { getMovieDetails, assertTmdbEnv } from "../../../../src/lib/tmdb";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    assertTmdbEnv();
    const { id } = await ctx.params;
    const movieId = Number(id);
    if (!Number.isFinite(movieId)) {
      return NextResponse.json({ error: "Invalid movie id" }, { status: 400 });
    }
    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language") ?? "en-US";

    const data = await getMovieDetails(movieId, { language });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch movie details", details: err?.details },
      { status: 500 }
    );
  }
}
