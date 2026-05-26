export type FetchMode = "rss" | "scrape" | "pdf_link";
export type SourceHealth = "ok" | "degraded" | "down";

export type Company = {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
};

export type Term = {
  word: string;
  reading?: string;
  meaning: string;
  tags: string[];
};

export type Article = {
  id: string;
  companyId: string;
  title: string;
  summaryShort: string;
  summaryLong: string;
  words: Term[];
  tags: string[];
  sourceUrl: string;
  pdfUrl?: string;
  publishedAt?: string;
  detectedAt: string;
  fetchMode: FetchMode;
  sourceItemId: string;
  aiProcessedAt?: string;
};

export type Source = {
  id: string;
  companyId: string;
  url: string;
  mode: FetchMode;
  health: SourceHealth;
  enabled: boolean;
  lastCrawledAt?: string;
  sevenDayCount: number;
  failureCount: number;
};
