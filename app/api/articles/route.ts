import { NextRequest, NextResponse } from "next/server";
import { listArticles } from "@/lib/data";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  return NextResponse.json(await listArticles(params));
}
