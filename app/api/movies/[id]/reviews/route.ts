import { NextRequest, NextResponse } from "next/server";
import { getMovieReviews, assertTmdbEnv } from "../../../../../src/lib/tmdb";

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
    const page = Number(searchParams.get("page") || "1");
    const language = searchParams.get("language") ?? "en-US";

    const data = await getMovieReviews(movieId, { page, language });
    return NextResponse.json({
      id: movieId,
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results: data.results
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch reviews", details: err?.details },
      { status: 500 }
    );
  }
}
