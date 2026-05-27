import { NextResponse } from "next/server";
import { getArticle } from "@/lib/data";

type ArticleRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: ArticleRouteProps) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    { data: article },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300"
      }
    }
  );
}
