import { NextResponse } from "next/server";
import { getArticles } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const articles = await getArticles({
    q: searchParams.get("q"),
    tag: searchParams.get("tag"),
    sort: searchParams.get("sort")
  });

  return NextResponse.json(
    { data: articles, nextCursor: null },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300"
      }
    }
  );
}
