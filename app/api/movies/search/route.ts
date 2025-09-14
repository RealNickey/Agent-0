import { NextRequest, NextResponse } from "next/server";
import {
  searchMovies,
  toMovieCard,
  assertTmdbEnv,
} from "../../../../src/lib/tmdb";

// Search results can be cached briefly
export const revalidate = 120;

export async function GET(req: NextRequest) {
  try {
    assertTmdbEnv();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const data = await searchMovies({
      query,
      page,
      include_adult: false,
      language: "en-US",
    });
    const items = data.results.map(toMovieCard);

    return NextResponse.json(
      {
        page: data.page,
        total_pages: Math.min(data.total_pages, 20), // Limit to 20 pages for performance
        total_results: data.total_results,
        items,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
        },
      }
    );
  } catch (err: any) {
    console.error("Search movies API error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
