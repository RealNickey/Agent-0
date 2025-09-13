import { NextRequest, NextResponse } from "next/server";
import { getMovieDetails, assertTmdbEnv } from "../../../../src/lib/tmdb";

// Movie details change rarely, cache for longer
export const revalidate = 3600; // 1 hour

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    assertTmdbEnv();
    const { id } = await ctx.params;
    const movieId = Number(id);

    if (!Number.isFinite(movieId) || movieId <= 0) {
      return NextResponse.json({ error: "Invalid movie id" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language") ?? "en-US";

    const data = await getMovieDetails(movieId, { language });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      },
    });
  } catch (err: any) {
    console.error("Movie details API error:", err);
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }
}
