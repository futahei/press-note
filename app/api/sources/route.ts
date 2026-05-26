import { NextResponse } from "next/server";
import { getSources } from "@/lib/data";

export async function GET() {
  return NextResponse.json(
    { data: getSources().filter((source) => source.enabled) },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300"
      }
    }
  );
}

