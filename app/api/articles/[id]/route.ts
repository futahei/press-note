import { NextResponse } from "next/server";
import { getArticle } from "@/lib/data";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  return article ? NextResponse.json(article) : NextResponse.json({ error: "Not found" }, { status: 404 });
}
