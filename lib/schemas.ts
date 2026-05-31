import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const sourceInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: z.string().trim().url(),
  enabled: z.boolean().default(true),
  initialImportCount: z.coerce.number().int().min(0).max(20).default(0)
});

export const sourceUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  url: z.string().trim().url().optional(),
  enabled: z.coerce.boolean().optional()
});

export function normalizePublishedAt(value: unknown) {
  if (value == null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed || /^(?:null|unknown|不明|未取得|なし)$/i.test(trimmed)) return null;

  const dateOnly = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  const japaneseDate = trimmed.match(/^(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  const match = dateOnly ?? japaneseDate;
  if (match) {
    const [, year, month, day] = match;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString();
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();

  return null;
}

export const articleSummarySchema = z.object({
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1).max(120),
  published_at: z.preprocess(normalizePublishedAt, z.string().datetime().nullable()),
  is_press_release: z.boolean(),
  terms: z
    .array(
      z.object({
        headword: z.string().trim().min(1).max(80),
        reading: z.string().trim().min(1).max(120),
        description: z.string().trim().min(1).max(800)
      })
    )
    .max(20)
});

export const termInputSchema = z.object({
  headword: z.string().trim().min(1).max(80),
  reading: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1200),
  source_kind: z.enum(["ai", "manual"]).default("manual")
});

export const termUpdateSchema = termInputSchema.partial().extend({
  source_kind: z.enum(["ai", "manual"]).optional()
});

export const sourcePreviewSchema = sourceInputSchema.pick({
  name: true,
  url: true,
  initialImportCount: true
});

export const reportReasonSchema = z.enum(["not_press_release", "duplicate"]);

export const articleReportSchema = z.object({
  reason: reportReasonSchema.default("not_press_release")
});

export const previewArticleSchema = articleSummarySchema.extend({
  url: z.string().url()
});

export const sourceCreateJsonSchema = sourceInputSchema.extend({
  previewArticles: z.array(previewArticleSchema).max(20).default([])
});

function emptyStringToUndefined(value: unknown) {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

const optionalQueryTextSchema = z.preprocess(emptyStringToUndefined, z.string().trim().max(120).optional());
const optionalQueryUuidSchema = z.preprocess(emptyStringToUndefined, z.string().uuid().optional());
const optionalQueryDateSchema = z.preprocess(emptyStringToUndefined, z.string().date().optional());

export const articleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  q: optionalQueryTextSchema,
  source: optionalQueryUuidSchema,
  date: optionalQueryDateSchema,
  from: optionalQueryDateSchema,
  to: optionalQueryDateSchema
});

export const termQuerySchema = z.object({
  q: optionalQueryTextSchema,
  initial: z.preprocess(emptyStringToUndefined, z.string().trim().max(2).optional())
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1)
  })
});

export type ArticleSummaryOutput = z.infer<typeof articleSummarySchema>;
export type PreviewArticle = z.infer<typeof previewArticleSchema>;
