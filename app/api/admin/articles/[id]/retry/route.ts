import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { resummarizeArticle } from "@/lib/crawler";
import { articleRetrySchema } from "@/lib/schemas";
import { isSafeOrigin } from "@/lib/security";
import { getOptionalServiceSupabase } from "@/lib/supabase";

function revalidateArticlePages(articleId: string) {
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath(`/articles/${articleId}`);
  revalidatePath("/terms");
  revalidatePath("/admin");
  revalidatePath("/admin/articles");
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSafeOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const isJson = request.headers.get("content-type")?.includes("application/json");
  const redirectTo = new URL("/admin/articles", request.url);
  const supabase = getOptionalServiceSupabase();
  if (!supabase) {
    if (isJson) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    redirectTo.searchParams.set("retry", "unavailable");
    return NextResponse.redirect(redirectTo, { status: 303 });
  }

  const { id } = await params;
  const input = articleRetrySchema.parse(
    isJson ? await request.json() : Object.fromEntries(await request.formData())
  );

  try {
    const article = await resummarizeArticle({ articleId: id, url: input.url });
    revalidateArticlePages(id);

    if (isJson) return NextResponse.json({ ok: true, article });
    redirectTo.searchParams.set("retry", "success");
    return NextResponse.redirect(redirectTo, { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Retry failed";
    if (isJson) return NextResponse.json({ error: message }, { status: 500 });
    redirectTo.searchParams.set("retry", "error");
    return NextResponse.redirect(redirectTo, { status: 303 });
  }
}
