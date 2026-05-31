import { NextRequest, NextResponse } from "next/server";
import { listTermsPage } from "@/lib/data";

export async function GET(request: NextRequest) {
  return NextResponse.json(await listTermsPage(Object.fromEntries(request.nextUrl.searchParams)));
}
