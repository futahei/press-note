import { NextResponse } from "next/server";
import { listOpenReports } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await listOpenReports());
}
