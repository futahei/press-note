import { NextResponse } from "next/server";
import { getTermEntries } from "@/lib/data";
import { termSchema } from "@/lib/schemas";

export async function GET() {
  return NextResponse.json({ data: getTermEntries() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = termSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid word", issues: parsed.error.issues }, { status: 400 });
  }

  return NextResponse.json(
    {
      data: {
        id: crypto.randomUUID(),
        ...parsed.data
      }
    },
    { status: 201 }
  );
}

