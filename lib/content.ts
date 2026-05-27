import { createHash } from "node:crypto";

export type SourceMode = "rss" | "scrape" | "pdf_link";

export type FlatSourceSelectors = {
  item?: string;
  title?: string;
  url?: string;
  published_at?: string;
  body?: string;
  pdf_link?: string;
};

export type PipelineSourceSelectors = {
  list: {
    item: string;
    title: string;
    date: string;
    url: string;
  };
  detail: {
    body: string;
    followLinks?: string[];
  };
};

export type SourceSelectors = FlatSourceSelectors | PipelineSourceSelectors;

export type SourceCandidate = {
  title: string;
  url: string;
  publishedAt?: string;
  pdfUrl?: string;
};

type HtmlElement = {
  tag: string;
  attrs: string;
  innerHtml: string;
  outerHtml: string;
  index: number;
};

const pressPattern =
  /(press|release|news|ir|announcement|topics|notice|pr|プレス|リリース|ニュース|お知らせ|広報|適時開示|決算|発表|新商品|サービス)/i;

export const defaultSelectors: PipelineSourceSelectors = {
  list: {
    item: "a",
    title: "a",
    date: "time, .date, .published",
    url: "a"
  },
  detail: {
    body: "main, article, body",
    followLinks: ["a[href$='.pdf']"]
  }
};

export function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

export function faviconUrl(url: string) {
  const host = new URL(url).hostname;
  return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
}

export function isPdfUrl(url: string) {
  return /\.pdf(?:$|[?#])/i.test(url);
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

export async function fetchBinary(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": `PressNoteBot/0.1 (+${process.env.NEXT_PUBLIC_APP_URL ?? "https://press-note.local"}/about)`,
        Accept: "application/pdf,*/*;q=0.8"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPdfText(url: string) {
  const buffer = await fetchBinary(url);
  return extractPdfText(buffer);
}

export function extractPdfText(buffer: Buffer) {
  const source = buffer.toString("latin1");
  const chunks = [...source.matchAll(/\(([^()]|\\[()\\nrtbf]){2,}\)\s*Tj/g)]
    .map((match) => match[0].replace(/\)\s*Tj$/, "").slice(1))
    .map((text) =>
      text
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\")
    )
    .filter((text) => /[A-Za-z0-9\u0080-\u00ff]/.test(text));
  return chunks.join("\n").replace(/\s{2,}/g, " ").slice(0, 12000);
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

export function sanitizePreviewHtml(html: string) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/\son[a-z]+=["'][^"']*["']/gi, "")
    .replace(/\shref=["']javascript:[^"']*["']/gi, "")
    .slice(0, 250000);
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
    return title.split(/[|｜\-–—・]/).at(-1)?.trim() || title;
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

export function suggestSelectors(html: string): PipelineSourceSelectors {
  if (html.includes("news-article")) {
    return {
      list: {
        item: ".news-article",
        title: ".news-article__title",
        date: ".news-article__date",
        url: "a"
      },
      detail: {
        body: ".jin__content, main, article, body",
        followLinks: ["a[href$='.pdf']"]
      }
    };
  }
  return defaultSelectors;
}

export function normalizeSelectors(selectors?: SourceSelectors | null): PipelineSourceSelectors {
  if (selectors && "list" in selectors && "detail" in selectors) {
    return selectors;
  }
  const flat = selectors ?? {};
  return {
    list: {
      item: flat.item ?? defaultSelectors.list.item,
      title: flat.title ?? defaultSelectors.list.title,
      date: flat.published_at ?? defaultSelectors.list.date,
      url: flat.url ?? defaultSelectors.list.url
    },
    detail: {
      body: flat.body ?? defaultSelectors.detail.body,
      followLinks: flat.pdf_link ? [flat.pdf_link] : defaultSelectors.detail.followLinks
    }
  };
}

function sourceCandidate(title: string, url: string, publishedAt?: string): SourceCandidate {
  const candidate: SourceCandidate = { title, url };
  if (publishedAt) {
    candidate.publishedAt = publishedAt;
  }
  if (isPdfUrl(url)) {
    candidate.pdfUrl = url;
  }
  return candidate;
}

export function extractRssItems(xml: string, baseUrl: string, limit = 20): SourceCandidate[] {
  const itemMatches = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)];
  const entryMatches = itemMatches.length > 0 ? [] : [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)];
  const blocks = [...itemMatches, ...entryMatches].map((match) => match[0]);

  return blocks
    .map((block): SourceCandidate | null => {
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
      return sourceCandidate(title, url, parseDate(publishedText));
    })
    .filter((item): item is SourceCandidate => item !== null)
    .slice(0, limit);
}

export function extractConfiguredItems(html: string, baseUrl: string, selectors?: SourceSelectors | null, limit = 20): SourceCandidate[] {
  const normalized = normalizeSelectors(selectors);
  const items = findElements(html, normalized.list.item);
  if (items.length === 0) {
    return extractPressLinks(html, baseUrl, limit);
  }

  const candidates = new Map<string, SourceCandidate>();
  for (const item of items) {
    const titleElement = firstElement(item.outerHtml, normalized.list.title);
    const dateElement = firstElement(item.outerHtml, normalized.list.date);
    const urlElement = firstElement(item.outerHtml, normalized.list.url);
    const href = urlElement ? getAttr(urlElement.attrs, "href") : undefined;
    const url = href ? resolveUrl(baseUrl, href) : undefined;
    const title = stripTags(titleElement?.innerHtml ?? urlElement?.innerHtml ?? item.innerHtml).slice(0, 180);
    if (!url || !title) {
      continue;
    }
    const publishedAt = parseDate(stripTags(dateElement?.innerHtml ?? ""));
    candidates.set(url, sourceCandidate(title, url, publishedAt));
    if (candidates.size >= limit) {
      break;
    }
  }
  return [...candidates.values()];
}

export function extractPressLinks(html: string, baseUrl: string, limit = 20): SourceCandidate[] {
  const candidates = new Map<string, SourceCandidate>();
  for (const anchor of findElements(html, "a")) {
    const href = getAttr(anchor.attrs, "href");
    const text = stripTags(anchor.innerHtml);
    const url = href ? resolveUrl(baseUrl, href) : undefined;
    if (!url || !text || text.length < 4 || text.length > 180) {
      continue;
    }
    if (!pressPattern.test(`${text} ${url}`)) {
      continue;
    }
    candidates.set(url, sourceCandidate(text, url, parseDate(stripTags(html.slice(Math.max(0, anchor.index - 300), anchor.index + anchor.outerHtml.length + 300)))));
    if (candidates.size >= limit) {
      break;
    }
  }
  return [...candidates.values()];
}

export function extractReadableText(html: string, bodySelector?: string) {
  const title = getPageTitle(html);
  const description = getMetaContent(html, "description") ?? getMetaContent(html, "og:description") ?? "";
  const selected = bodySelector ? firstElement(html, bodySelector)?.innerHtml : undefined;
  const main = selected ?? html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? html;
  return [title, description, stripTags(main)].filter(Boolean).join("\n\n").slice(0, 12000);
}

export function firstElement(html: string, selector: string) {
  return findElements(html, selector)[0];
}

export function findElements(html: string, selector: string): HtmlElement[] {
  const selectors = selector
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const results: HtmlElement[] = [];
  for (const single of selectors) {
    results.push(...findElementsBySingleSelector(html, single));
    if (results.length > 0) {
      return results;
    }
  }
  return results;
}

function findElementsBySingleSelector(html: string, selector: string): HtmlElement[] {
  const startTagPattern = /<([a-z][\w:-]*)(\s[^>]*)?>/gi;
  const results: HtmlElement[] = [];
  for (const match of html.matchAll(startTagPattern)) {
    const tag = match[1].toLowerCase();
    const attrs = match[2] ?? "";
    if (!matchesSelector(tag, attrs, selector)) {
      continue;
    }
    const index = match.index ?? 0;
    const endIndex = findElementEnd(html, tag, index + match[0].length);
    const outerHtml = html.slice(index, endIndex);
    const innerHtml = outerHtml.replace(new RegExp(`^<${tag}\\b[^>]*>`, "i"), "").replace(new RegExp(`</${tag}>\\s*$`, "i"), "");
    results.push({ tag, attrs, innerHtml, outerHtml, index });
  }
  return results;
}

function matchesSelector(tag: string, attrs: string, selector: string) {
  const attrSuffix = selector.match(/^([a-z][\w:-]*)?\[href\$=['"]([^'"]+)['"]\]$/i);
  if (attrSuffix) {
    return (!attrSuffix[1] || tag === attrSuffix[1].toLowerCase()) && (getAttr(attrs, "href") ?? "").endsWith(attrSuffix[2]);
  }

  const attrExists = selector.match(/^([a-z][\w:-]*)?\[href\]$/i);
  if (attrExists) {
    return (!attrExists[1] || tag === attrExists[1].toLowerCase()) && Boolean(getAttr(attrs, "href"));
  }

  const idMatch = selector.match(/^#([\w-]+)$/);
  if (idMatch) {
    return getAttr(attrs, "id") === idMatch[1];
  }

  const classOnly = selector.match(/^\.([\w-]+)$/);
  if (classOnly) {
    return hasClass(attrs, classOnly[1]);
  }

  const tagClass = selector.match(/^([a-z][\w:-]*)\.([\w-]+)$/i);
  if (tagClass) {
    return tag === tagClass[1].toLowerCase() && hasClass(attrs, tagClass[2]);
  }

  return tag === selector.toLowerCase();
}

function findElementEnd(html: string, tag: string, searchStart: number) {
  if (/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(tag)) {
    return searchStart;
  }
  const tokenPattern = new RegExp(`</?${tag}\\b[^>]*>`, "gi");
  tokenPattern.lastIndex = searchStart;
  let depth = 1;
  for (const match of html.matchAll(tokenPattern)) {
    const token = match[0];
    if (token.startsWith("</")) {
      depth -= 1;
    } else if (!token.endsWith("/>")) {
      depth += 1;
    }
    if (depth === 0) {
      return (match.index ?? searchStart) + token.length;
    }
  }
  return searchStart;
}

export function getAttr(attrs: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return attrs.match(new RegExp(`\\s${escaped}=["']([^"']+)["']`, "i"))?.[1];
}

function hasClass(attrs: string, className: string) {
  return (getAttr(attrs, "class") ?? "").split(/\s+/).includes(className);
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
