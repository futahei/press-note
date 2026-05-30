import { NextRequest, NextResponse } from "next/server";
import { listTerms } from "@/lib/data";

export async function GET(request: NextRequest) {
  return NextResponse.json(await listTerms(Object.fromEntries(request.nextUrl.searchParams)));
}
