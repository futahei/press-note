import { createHash } from "node:crypto";

export type SourceMode = "rss" | "scrape" | "pdf_link";

export type SourceSelectors = {
  item?: string;
  title?: string;
  url?: string;
  published_at?: string;
  body?: string;
  pdf_link?: string;
};

export type SourceCandidate = {
  title: string;
  url: string;
  publishedAt?: string;
};

const pressPattern =
  /(press|release|news|ir|announcement|topics|notice|プレス|リリース|ニュース|お知らせ|広報|適時開示|決算|発表|新商品|サービス)/i;

export function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export function faviconUrl(url: string) {
  const host = new URL(url).hostname;
  return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
}

export async function fetchText(url: string, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": `PressNoteBot/0.1 (+${process.env.NEXT_PUBLIC_APP_URL ?? "https://press-note.local"}/about)`,
        Accept: "text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.8"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export function decodeHtml(input: string) {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

export function stripTags(input: string) {
  return decodeHtml(input.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

export function getMetaContent(html: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["'][^>]*>`, "i")
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtml(match[1]).trim();
    }
  }
  return undefined;
}

export function getPageTitle(html: string) {
  return getMetaContent(html, "og:title") ?? stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
}

export function getSiteName(html: string, url: string) {
  const siteName = getMetaContent(html, "og:site_name");
  if (siteName) {
    return siteName;
  }
  const title = getPageTitle(html);
  if (title) {
    return title.split(/[｜|\-–—]/).at(-1)?.trim() || title;
  }
  return new URL(url).hostname;
}

export function resolveUrl(baseUrl: string, href: string) {
  try {
    return new URL(decodeHtml(href), baseUrl).toString();
  } catch {
    return undefined;
  }
}

export function detectFeedUrl(html: string, baseUrl: string) {
  const linkPattern = /<link\b[^>]*>/gi;
  for (const match of html.matchAll(linkPattern)) {
    const tag = match[0];
    if (!/application\/(rss|atom)\+xml|text\/xml/i.test(tag)) {
      continue;
    }
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href) {
      continue;
    }
    const resolved = resolveUrl(baseUrl, href);
    if (resolved) {
      return resolved;
    }
  }
  return undefined;
}

export function extractRssItems(xml: string, baseUrl: string, limit = 20): SourceCandidate[] {
  const itemMatches = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)];
  const entryMatches = itemMatches.length > 0 ? [] : [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)];
  const blocks = [...itemMatches, ...entryMatches].map((match) => match[0]);

  return blocks
    .map((block) => {
      const title = stripTags(block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
      const guid = stripTags(block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1] ?? "");
      const linkText = stripTags(block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? "");
      const href = block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1];
      const publishedText =
        stripTags(block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "") ||
        stripTags(block.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1] ?? "") ||
        stripTags(block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] ?? "");
      const url = resolveUrl(baseUrl, href ?? (linkText || guid));
      if (!title || !url) {
        return null;
      }
      const publishedAt = parseDate(publishedText);
      return publishedAt ? { title, url, publishedAt } : { title, url };
    })
    .filter((item): item is SourceCandidate => item !== null)
    .slice(0, limit);
}

export function extractPressLinks(html: string, baseUrl: string, limit = 20): SourceCandidate[] {
  const candidates = new Map<string, SourceCandidate>();
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const href = match[1];
    const text = stripTags(match[2]);
    const url = resolveUrl(baseUrl, href);
    if (!url || !text || text.length < 4 || text.length > 180) {
      continue;
    }
    if (!pressPattern.test(`${text} ${url}`)) {
      continue;
    }
    const nearby = html.slice(Math.max(0, match.index - 300), Math.min(html.length, match.index + match[0].length + 300));
    candidates.set(url, {
      title: text,
      url,
      publishedAt: parseDate(stripTags(nearby))
    });
    if (candidates.size >= limit) {
      break;
    }
  }

  return [...candidates.values()];
}

export function extractReadableText(html: string) {
  const title = getPageTitle(html);
  const description = getMetaContent(html, "description") ?? getMetaContent(html, "og:description") ?? "";
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? html;
  return [title, description, stripTags(main)].filter(Boolean).join("\n\n").slice(0, 12000);
}

export function parseDate(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return undefined;
  }

  const isoLike = trimmed.match(/\d{4}[-/.年]\s*\d{1,2}[-/.月]\s*\d{1,2}/)?.[0];
  const source = isoLike
    ? isoLike.replace(/年|月/g, "-").replace(/日/g, "").replace(/\//g, "-").replace(/\s+/g, "")
    : trimmed;
  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export const defaultSelectors: SourceSelectors = {
  item: "a",
  title: "title, h1, h2",
  url: "a[href]",
  published_at: "time, .date, .published",
  body: "main, article, body",
  pdf_link: "a[href$='.pdf']"
};
