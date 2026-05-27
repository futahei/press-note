import { NextResponse } from "next/server";
import { getSources } from "@/lib/data";

export async function GET() {
  const sources = await getSources();
  return NextResponse.json(
    { data: sources.filter((source) => source.enabled) },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300"
      }
    }
  );
}
