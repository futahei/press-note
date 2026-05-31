"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import type { Article } from "@/lib/types";

type ArticlesResponse = {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

type SearchParams = Record<string, string>;

function buildUrl(searchParams: SearchParams, page: number, limit: number) {
  const params = new URLSearchParams(searchParams);
  params.set("page", String(page));
  params.set("limit", String(limit));
  return `/api/articles?${params.toString()}`;
}

export function InfiniteArticleList({
  initialArticles,
  initialPage,
  initialLimit,
  initialHasMore,
  total,
  searchParams
}: {
  initialArticles: Article[];
  initialPage: number;
  initialLimit: number;
  initialHasMore: boolean;
  total: number;
  searchParams: SearchParams;
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlightRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (inFlightRef.current || !hasMore) return;
    inFlightRef.current = true;
    setLoading(true);
    setFailed(false);

    try {
      const nextPage = page + 1;
      const response = await fetch(buildUrl(searchParams, nextPage, initialLimit)).catch(() => null);
      if (!response?.ok) {
        setFailed(true);
        return;
      }

      const payload = (await response.json()) as ArticlesResponse;
      setArticles((current) => [...current, ...payload.articles]);
      setPage(payload.page);
      setHasMore(payload.hasMore);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [hasMore, initialLimit, page, searchParams]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "360px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || !hasMore) return;
    if (sentinel.getBoundingClientRect().top <= window.innerHeight + 360) {
      void loadMore();
    }
  }, [articles.length, hasMore, loadMore, loading]);

  return (
    <div className="infinite-list">
      <p className="small">
        {total} 件中 {articles.length} 件を表示
      </p>
      <div className="grid">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      <div ref={sentinelRef} className="infinite-sentinel" aria-hidden="true" />
      {loading ? (
        <p className="loading-status" role="status">
          <span className="loading-spinner" aria-hidden="true" />
          読み込み中
        </p>
      ) : null}
      {failed ? (
        <div className="button-row">
          <p className="small form-error" role="alert">
            追加の記事を読み込めませんでした。
          </p>
          <button className="button-secondary" type="button" onClick={() => void loadMore()}>
            再試行
          </button>
        </div>
      ) : null}
      {!hasMore && articles.length > 0 ? <p className="small muted">すべての記事を表示しました。</p> : null}
    </div>
  );
}
