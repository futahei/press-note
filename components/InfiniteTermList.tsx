"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Term } from "@/lib/types";

type TermsResponse = {
  terms: Term[];
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
  return `/api/terms?${params.toString()}`;
}

function TermCard({ term }: { term: Term }) {
  return (
    <article className="utility-card">
      <div className="small">
        {term.reading} ・ 関連 {term.article_count ?? 0} 件
      </div>
      <h3>
        <Link className="text-link" href={`/terms/${term.id}`}>
          {term.headword}
        </Link>
      </h3>
      <p>{term.description}</p>
    </article>
  );
}

export function InfiniteTermList({
  initialTerms,
  initialPage,
  initialLimit,
  initialHasMore,
  total,
  searchParams
}: {
  initialTerms: Term[];
  initialPage: number;
  initialLimit: number;
  initialHasMore: boolean;
  total: number;
  searchParams: SearchParams;
}) {
  const [terms, setTerms] = useState(initialTerms);
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

      const payload = (await response.json()) as TermsResponse;
      setTerms((current) => [...current, ...payload.terms]);
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
  }, [hasMore, loadMore, loading, terms.length]);

  return (
    <div className="infinite-list">
      <p className="small">
        {total} 件中 {terms.length} 件を表示
      </p>
      <div className="grid">
        {terms.map((term) => (
          <TermCard key={term.id} term={term} />
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
            追加の用語を読み込めませんでした。
          </p>
          <button className="button-secondary" type="button" onClick={() => void loadMore()}>
            再試行
          </button>
        </div>
      ) : null}
      {!hasMore && terms.length > 0 ? <p className="small muted">すべての用語を表示しました。</p> : null}
    </div>
  );
}
