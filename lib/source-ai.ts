import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { aiSummarySchema } from "./schemas";
import { extractReadableText, fetchPdfText, fetchText, firstElement, getAttr, isPdfUrl, normalizeSelectors, resolveUrl, type SourceSelectors } from "./content";
import { tagVocabulary } from "./tag-vocabulary";

type RawArticleForAi = {
  id: string;
  title: string;
  source_url: string;
  pdf_url?: string | null;
  sources?: { selectors?: unknown | null } | Array<{ selectors?: unknown | null }> | null;
};

type ArticleText = {
  text: string;
  pdfUrl?: string;
};

type ProcessResult = {
  articleId: string;
  status: "ok" | "error";
  message?: string;
};

function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

function getSourceSelectors(article: RawArticleForAi) {
  const source = Array.isArray(article.sources) ? article.sources[0] : article.sources;
  return source?.selectors ?? null;
}

async function readUrlText(url: string, bodySelector?: string) {
  if (isPdfUrl(url)) {
    const pdfText = await fetchPdfText(url).catch(() => "");
    return pdfText || `PDF URL: ${url}`;
  }

  const html = await fetchText(url);
  return extractReadableText(html, bodySelector);
}

async function getArticleText(article: RawArticleForAi): Promise<ArticleText> {
  const selectors = normalizeSelectors(getSourceSelectors(article) as SourceSelectors | null);
  const primaryUrl = article.pdf_url || article.source_url;

  if (isPdfUrl(primaryUrl)) {
    return { text: `${article.title}\n\n${await readUrlText(primaryUrl)}`, pdfUrl: primaryUrl };
  }

  const html = await fetchText(article.source_url);
  const parts = [extractReadableText(html, selectors.detail.body)];
  let firstPdfUrl = article.pdf_url ?? undefined;

  for (const selector of selectors.detail.followLinks ?? []) {
    const link = firstElement(html, selector);
    const href = link ? getAttr(link.attrs, "href") : undefined;
    const url = href ? resolveUrl(article.source_url, href) : undefined;
    if (!url) {
      continue;
    }
    if (isPdfUrl(url)) {
      firstPdfUrl ??= url;
    }
    const linkedText = await readUrlText(url, selectors.detail.body).catch(() => "");
    if (linkedText) {
      parts.push(linkedText);
    }
  }

  const text = parts.filter(Boolean).join("\n\n").slice(0, 12000);
  return { text: text || `${article.title}\n\n${article.source_url}`, pdfUrl: firstPdfUrl };
}

export async function processArticleAi(client: SupabaseClient, article: RawArticleForAi): Promise<ProcessResult> {
  const openai = createOpenAIClient();
  if (!openai) {
    return { articleId: article.id, status: "error", message: "OPENAI_API_KEY is not configured" };
  }

  try {
    const articleText = await getArticleText(article);
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5.5",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You summarize press releases for Japanese readers. Return only JSON with summary_short, summary_long, words, and tags. Meanings must be standalone and not depend on article context."
        },
        {
          role: "user",
          content: JSON.stringify({
            title: article.title,
            text: articleText.text,
            allowed_tags: tagVocabulary,
            constraints: {
              language: "ja",
              max_tags: 3,
              max_words: 5,
              summary_short_max_chars: 140,
              summary_long_max_chars: 500
            }
          })
        }
      ]
    });

    const content = completion.choices[0]?.message.content;
    const parsedJson = content ? JSON.parse(content) : null;
    const parsed = aiSummarySchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new Error("OpenAI response did not match schema");
    }

    await client
      .from("articles")
      .update({
        summary_short: parsed.data.summary_short,
        summary_long: parsed.data.summary_long,
        tags: parsed.data.tags,
        pdf_url: articleText.pdfUrl ?? article.pdf_url ?? null,
        ai_processed_at: new Date().toISOString()
      })
      .eq("id", article.id);

    for (const word of parsed.data.words) {
      const { data: existing } = await client.from("words").select("id, deleted_at").eq("word", word.word).maybeSingle();
      if (existing?.deleted_at) {
        continue;
      }

      let wordId = existing?.id as string | undefined;
      if (!wordId) {
        const { data: inserted, error } = await client
          .from("words")
          .insert({
            word: word.word,
            reading: word.reading ?? null,
            meaning: word.meaning,
            tags: word.tags
          })
          .select("id")
          .single();
        if (error) {
          throw new Error(error.message);
        }
        wordId = inserted.id;
      }

      await client.from("article_words").upsert({ article_id: article.id, word_id: wordId }, { onConflict: "article_id,word_id" });
    }

    return { articleId: article.id, status: "ok" };
  } catch (error) {
    return { articleId: article.id, status: "error", message: error instanceof Error ? error.message : "Unknown AI error" };
  }
}
