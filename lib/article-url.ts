const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "yclid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "ref_src"
]);

export function normalizeArticleUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  try {
    const url = new URL(trimmed);
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    url.hash = "";

    for (const key of [...url.searchParams.keys()]) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey.startsWith("utm_") || TRACKING_PARAMS.has(normalizedKey)) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();

    if (url.pathname !== "/") {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }

    return url.toString();
  } catch {
    return trimmed;
  }
}

export function dedupeArticlesByUrl<T extends { url: string }>(articles: T[]) {
  const seen = new Set<string>();
  return articles.filter((article) => {
    const key = normalizeArticleUrl(article.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
