import { NextResponse } from "next/server";
import { getTermEntries } from "@/lib/data";
import { termSchema } from "@/lib/schemas";
import { getSupabaseAdminClient } from "@/lib/supabase";
import type { TermEntry } from "@/lib/data";
import { z } from "zod";

const updateWordSchema = termSchema.extend({
  originalWord: z.string().min(1)
});

const deleteWordSchema = z.object({
  word: z.string().min(1)
});

function unavailable() {
  return NextResponse.json({ error: "Supabase service role key is not configured" }, { status: 503 });
}

function toEntry(word: { word: string; reading: string | null; meaning: string; tags: string[] | null }): TermEntry {
  return {
    word: word.word,
    reading: word.reading ?? undefined,
    meaning: word.meaning,
    tags: word.tags ?? [],
    count: 0,
    articles: []
  };
}

export async function GET() {
  return NextResponse.json({ data: await getTermEntries() });
}

export async function POST(request: Request) {
  const client = getSupabaseAdminClient();
  if (!client) {
    return unavailable();
  }

  const body = await request.json().catch(() => null);
  const parsed = termSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid word", issues: parsed.error.issues }, { status: 400 });
  }

  const { data, error } = await client
    .from("words")
    .insert({
      word: parsed.data.word,
      reading: parsed.data.reading ?? null,
      meaning: parsed.data.meaning,
      tags: parsed.data.tags
    })
    .select("word, reading, meaning, tags")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === "23505" ? 409 : 500 });
  }

  return NextResponse.json({ data: toEntry(data) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const client = getSupabaseAdminClient();
  if (!client) {
    return unavailable();
  }

  const body = await request.json().catch(() => null);
  const parsed = updateWordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid word", issues: parsed.error.issues }, { status: 400 });
  }

  const { data, error } = await client
    .from("words")
    .update({
      word: parsed.data.word,
      reading: parsed.data.reading ?? null,
      meaning: parsed.data.meaning,
      tags: parsed.data.tags,
      updated_at: new Date().toISOString()
    })
    .eq("word", parsed.data.originalWord)
    .is("deleted_at", null)
    .select("word, reading, meaning, tags")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === "23505" ? 409 : 500 });
  }

  return NextResponse.json({ data: toEntry(data) });
}

export async function DELETE(request: Request) {
  const client = getSupabaseAdminClient();
  if (!client) {
    return unavailable();
  }

  const body = await request.json().catch(() => null);
  const parsed = deleteWordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid word", issues: parsed.error.issues }, { status: 400 });
  }

  const { error } = await client
    .from("words")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("word", parsed.data.word)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
