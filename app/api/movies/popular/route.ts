import { NextRequest, NextResponse } from "next/server";
import {
  getPopularMovies,
  toMovieCard,
  assertTmdbEnv,
} from "../../../../src/lib/tmdb";

// Cache popular movies for 10 minutes since they don't change frequently
export const revalidate = 600;

export async function GET(req: NextRequest) {
  try {
    assertTmdbEnv();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || "1");
    const language = searchParams.get("language") ?? "en-US";

    const data = await getPopularMovies({ page, language });
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
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: any) {
    const message = err?.message || "Failed to fetch popular movies";
    console.error("Popular movies API error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
