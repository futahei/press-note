export type Source = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  last_crawled_at: string | null;
  created_at: string;
};

export type Article = {
  id: string;
  source_id: string;
  url: string;
  title: string;
  summary: string;
  published_at: string | null;
  fetched_at: string;
  is_deleted: boolean;
  source?: Pick<Source, "id" | "name" | "url"> | null;
};

export type Term = {
  id: string;
  headword: string;
  reading: string;
  description: string;
  source_kind: "ai" | "manual";
  created_at: string;
  updated_at: string;
  article_count?: number;
};

export type Report = {
  id: string;
  article_id: string;
  reason: "not_press_release" | "duplicate";
  status: "open" | "accepted" | "rejected";
  created_at: string;
  resolved_at: string | null;
  article?: Article | null;
};

export type BugReportLog = {
  level: "error" | "unhandledrejection";
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  occurred_at: string;
};

export type BugReport = {
  id: string;
  kind: "bug" | "feature";
  message: string;
  path: string;
  user_agent: string | null;
  viewport: string | null;
  language: string | null;
  timezone: string | null;
  logs: BugReportLog[];
  status: "open" | "resolved";
  created_at: string;
  resolved_at: string | null;
};

export type UsageDaily = {
  usage_date: string;
  model: string;
  cost_usd: number;
  input_tokens: number;
  output_tokens: number;
};
