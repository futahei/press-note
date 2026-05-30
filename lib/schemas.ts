import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const sourceInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: z.string().trim().url(),
  enabled: z.boolean().default(true),
  initialImportCount: z.coerce.number().int().min(0).max(20).default(0)
});

export const articleSummarySchema = z.object({
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1).max(100),
  published_at: z.string().datetime().nullable(),
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

export const articleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().trim().max(120).optional(),
  source: z.string().uuid().optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional()
});

export const termQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  initial: z.string().trim().max(2).optional()
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1)
  })
});

export type ArticleSummaryOutput = z.infer<typeof articleSummarySchema>;
