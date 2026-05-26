import { z } from "zod";
import { tagVocabulary } from "./sample-data";

export const termSchema = z.object({
  term: z.string().min(1),
  description: z.string().min(1)
});

export const aiSummarySchema = z.object({
  summary_short: z.string().max(140),
  summary_long: z.string().max(500),
  terms: z.array(termSchema).max(5),
  tags: z.array(z.enum(tagVocabulary)).max(3)
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1)
  }),
  timezone: z.string().min(1),
  notify_local_time: z.string().regex(/^\d{2}:(00|30)$/),
  role: z.enum(["user", "admin"]).default("user")
});

export const sourceAnalyzeSchema = z.object({
  url: z.string().url()
});

