import { NextResponse } from "next/server";
import { termSchema } from "@/lib/schemas";

type WordRouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: WordRouteProps) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = termSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid word", issues: parsed.error.issues }, { status: 400 });
  }

  return NextResponse.json({
    data: {
      id,
      ...parsed.data
    }
  });
}

export async function DELETE(_: Request, { params }: WordRouteProps) {
  const { id } = await params;

  return NextResponse.json({
    data: {
      id,
      deleted: true
    }
  });
}

