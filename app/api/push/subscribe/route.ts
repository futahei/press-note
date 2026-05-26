import { NextResponse } from "next/server";
import { pushSubscriptionSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = pushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription", issues: parsed.error.issues }, { status: 400 });
  }

  return NextResponse.json({
    data: {
      subscribed: true,
      timezone: parsed.data.timezone,
      notify_local_time: parsed.data.notify_local_time,
      role: parsed.data.role
    }
  });
}

