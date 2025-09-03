import { NextRequest, NextResponse } from "next/server";
import { getPopularMovies, toMovieCard, assertTmdbEnv } from "../../../../src/lib/tmdb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    assertTmdbEnv();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || "1");
    const language = searchParams.get("language") ?? "en-US";

    const data = await getPopularMovies({ page, language });
    const items = data.results.map(toMovieCard);

    return NextResponse.json({ 
      page: data.page, 
      total_pages: data.total_pages, 
      total_results: data.total_results,
      items 
    });
  } catch (err: any) {
    const message = err?.message || "Failed to fetch popular movies";
    const details = err?.details;
    return NextResponse.json({ error: message, details }, { status: 500 });
  }
}
