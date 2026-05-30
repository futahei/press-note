import { NextResponse } from "next/server";
import { getTerm } from "@/lib/data";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const term = await getTerm(id);
  return term ? NextResponse.json(term) : NextResponse.json({ error: "Not found" }, { status: 404 });
}
