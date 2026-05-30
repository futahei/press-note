import { NextRequest, NextResponse } from "next/server";
import { summarizeUrlsForPreview } from "@/lib/crawler";
import { sourcePreviewSchema } from "@/lib/schemas";
import { isSafeOrigin } from "@/lib/security";

export async function POST(request: NextRequest) {
  if (!isSafeOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const input = sourcePreviewSchema.parse(await request.json());
  if (input.initialImportCount === 0) {
    return NextResponse.json({ articles: [], discovered: 0 });
  }

  const preview = await summarizeUrlsForPreview(
    { name: input.name, url: input.url },
    input.initialImportCount
  );
  return NextResponse.json(preview);
}
