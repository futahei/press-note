import { NextResponse } from "next/server";
import { bugReportInputSchema } from "@/lib/schemas";
import { getOptionalServiceSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const input = bugReportInputSchema.parse(await request.json());
  const payload =
    input.kind === "feature"
      ? {
          ...input,
          user_agent: "",
          viewport: "",
          language: "",
          timezone: "",
          logs: []
        }
      : input;
  const supabase = getOptionalServiceSupabase();
  if (!supabase) return NextResponse.json({ ok: true });

  const { error } = await supabase.from("bug_reports").insert(payload);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
