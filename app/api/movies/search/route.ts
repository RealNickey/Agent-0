import { NextRequest, NextResponse } from "next/server";
import { searchMovies, toMovieCard, assertTmdbEnv } from "../../../../src/lib/tmdb";

export const dynamic = "force-dynamic"; // avoid caching by default for search

export async function GET(req: NextRequest) {
  try {
    assertTmdbEnv();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const page = Number(searchParams.get("page") || "1");
    if (!query) {
      return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
    }

    const data = await searchMovies({ query, page, include_adult: false, language: "en-US" });
    const items = data.results.map(toMovieCard);

    return NextResponse.json({ page: data.page, total_pages: data.total_pages, items });
  } catch (err: any) {
    const message = err?.message || "Failed to search movies";
    const details = err?.details;
    return NextResponse.json({ error: message, details }, { status: 500 });
  }
}
