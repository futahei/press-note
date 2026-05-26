import { NextResponse } from "next/server";
import { getSources } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ data: getSources() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  return NextResponse.json(
    {
      data: {
        id: crypto.randomUUID(),
        ...body,
        health: "ok",
        enabled: true
      }
    },
    { status: 201 }
  );
}

