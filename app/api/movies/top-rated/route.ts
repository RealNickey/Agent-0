import { NextRequest, NextResponse } from "next/server";
import {
  getTopRatedMovies,
  toMovieCard,
  assertTmdbEnv,
} from "../../../../src/lib/tmdb";

// Cache top rated movies for 1 hour similar to details TTL guidance
export const revalidate = 3600;

export async function GET(req: NextRequest) {
  try {
    assertTmdbEnv();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || "1");
    const language = searchParams.get("language") ?? "en-US";

    const data = await getTopRatedMovies({ page, language });
    const items = data.results.map(toMovieCard);

    return NextResponse.json(
      {
        page: data.page,
        total_pages: data.total_pages,
        total_results: data.total_results,
        items,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        },
      }
    );
  } catch (err: any) {
    const message = err?.message || "Failed to fetch top rated movies";
    console.error("Top rated movies API error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
