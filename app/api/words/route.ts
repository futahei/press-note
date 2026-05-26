import { NextResponse } from "next/server";
import { getTermEntries } from "@/lib/data";

export async function GET() {
  const words = getTermEntries().map((word) => ({
    ...word,
    articles: word.articles.slice(0, 3)
  }));

  return NextResponse.json(
    { data: words },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300"
      }
    }
  );
}

