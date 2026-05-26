import { articles, companies, sources } from "./sample-data";
import type { Article, Company, Source } from "./types";

export function getCompany(companyId: string): Company {
  const company = companies.find((item) => item.id === companyId);
  if (!company) {
    throw new Error(`Company not found: ${companyId}`);
  }
  return company;
}

export function getArticle(articleId: string): Article | undefined {
  return articles.find((article) => article.id === articleId);
}

export function getArticles(params?: { q?: string | null; tag?: string | null; sort?: string | null }) {
  const q = params?.q?.trim().toLowerCase();
  const tag = params?.tag?.trim();
  const sort = params?.sort ?? "latest";

  const filtered = articles.filter((article) => {
    const company = getCompany(article.companyId);
    const matchesQuery =
      !q ||
      [article.title, article.summaryShort, company.name, ...article.tags]
        .join(" ")
        .toLowerCase()
        .includes(q);
    const matchesTag = !tag || tag === "すべて" || article.tags.includes(tag);
    return matchesQuery && matchesTag;
  });

  return filtered.sort((a, b) => {
    if (sort === "company") {
      return getCompany(a.companyId).name.localeCompare(getCompany(b.companyId).name, "ja");
    }
    return getComparableDate(b).localeCompare(getComparableDate(a));
  });
}

export function getSources(): Source[] {
  return sources;
}

export function getFeaturedCompanies() {
  return companies
    .map((company) => ({
      company,
      count: articles.filter((article) => article.companyId === company.id).length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export function getTopicCounts(days = 1) {
  void days;
  const counts = new Map<string, number>();
  for (const article of articles) {
    for (const tag of article.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function getDailyTerms() {
  return articles.flatMap((article) => article.terms).slice(0, 5);
}

export function getComparableDate(article: Article) {
  return article.publishedAt ?? article.detectedAt;
}

export function getDisplayDate(article: Article) {
  const source = article.publishedAt ?? article.detectedAt;
  const date = new Date(source);
  const label = article.publishedAt ? "公開" : "検知";
  const formatted = new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
  return `${label} ${formatted}`;
}

