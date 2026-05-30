import { NextRequest, NextResponse } from "next/server";
import { pushSubscriptionSchema } from "@/lib/schemas";
import { getOptionalServiceSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = pushSubscriptionSchema.parse(await request.json());
  const supabase = getOptionalServiceSupabase();
  if (!supabase) return NextResponse.json({ ok: true });

  const { error } = await supabase.from("push_subscriptions").upsert({
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { endpoint } = (await request.json()) as { endpoint?: string };
  if (!endpoint) return NextResponse.json({ error: "endpoint is required" }, { status: 400 });

  const supabase = getOptionalServiceSupabase();
  if (supabase) await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}
