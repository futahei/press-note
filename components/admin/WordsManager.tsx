"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Term } from "@/lib/types";

type TermsPageResponse = {
  terms: Term[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

type SearchParams = Record<string, string>;

type WordsManagerProps = {
  initialTerms: Term[];
  initialPage: number;
  initialLimit: number;
  initialHasMore: boolean;
  total: number;
  searchParams: SearchParams;
};

function buildAdminWordsUrl(searchParams: SearchParams, page: number, limit: number) {
  const params = new URLSearchParams(searchParams);
  params.set("page", String(page));
  params.set("limit", String(limit));
  return `/api/admin/words?${params.toString()}`;
}

export function WordsManager({
  initialTerms,
  initialPage,
  initialLimit,
  initialHasMore,
  total,
  searchParams
}: WordsManagerProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);
  const [terms, setTerms] = useState(initialTerms);
  const [totalCount, setTotalCount] = useState(total);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    setTerms(initialTerms);
    setTotalCount(total);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setLoadError(null);
  }, [initialHasMore, initialPage, initialTerms, total]);

  const loadMore = useCallback(async () => {
    if (!hasMore || inFlightRef.current) return;
    const nextPage = page + 1;
    inFlightRef.current = true;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const response = await fetch(buildAdminWordsUrl(searchParams, nextPage, initialLimit), {
        headers: { accept: "application/json" }
      });
      if (!response.ok) throw new Error("用語を読み込めませんでした。");
      const payload = (await response.json()) as TermsPageResponse;
      setTerms((current) => {
        const currentIds = new Set(current.map((term) => term.id));
        return [...current, ...payload.terms.filter((term) => !currentIds.has(term.id))];
      });
      setPage(payload.page);
      setHasMore(payload.hasMore);
      setTotalCount(payload.total);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "用語を読み込めませんでした。");
    } finally {
      inFlightRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, initialLimit, page, searchParams]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loadingMore || loadError) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadMore();
      },
      { rootMargin: "480px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadError, loadMore, loadingMore]);

  async function updateTerm(id: string, payload: Partial<Pick<Term, "headword" | "reading" | "description">>) {
    setBusyAction(`patch:${id}`);
    try {
      const response = await fetch(`/api/admin/words/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setTerms((current) => current.map((term) => (term.id === id ? { ...term, ...payload } : term)));
      }
    } finally {
      setBusyAction(null);
    }
  }

  async function deleteTerm(id: string) {
    if (!confirm("この用語を削除しますか。関連記事との紐付けも削除されます。")) return;
    setBusyAction(`delete:${id}`);
    try {
      const response = await fetch(`/api/admin/words/${id}`, { method: "DELETE" });
      if (response.ok) {
        setTerms((current) => current.filter((term) => term.id !== id));
        setTotalCount((current) => Math.max(0, current - 1));
      }
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="admin-list" aria-live="polite">
      <p className="small">
        {totalCount.toLocaleString("ja-JP")} 件中 {terms.length.toLocaleString("ja-JP")} 件を表示
      </p>
      {terms.map((term) => (
        <article className="utility-card" key={term.id}>
          <div className="form-grid">
            <label>
              <span className="small">見出し語</span>
              <input
                className="input"
                defaultValue={term.headword}
                onBlur={(event) => {
                  if (event.target.value !== term.headword) updateTerm(term.id, { headword: event.target.value });
                }}
              />
            </label>
            <label>
              <span className="small">読み方</span>
              <input
                className="input"
                defaultValue={term.reading}
                onBlur={(event) => {
                  if (event.target.value !== term.reading) updateTerm(term.id, { reading: event.target.value });
                }}
              />
            </label>
            <label style={{ gridColumn: "span 2" }}>
              <span className="small">解説</span>
              <input
                className="input"
                defaultValue={term.description}
                onBlur={(event) => {
                  if (event.target.value !== term.description) updateTerm(term.id, { description: event.target.value });
                }}
              />
            </label>
            <button
              className="button-rect"
              type="button"
              disabled={busyAction !== null}
              onClick={() => deleteTerm(term.id)}
            >
              {busyAction === `delete:${term.id}` ? <span className="loading-spinner" aria-hidden="true" /> : null}
              削除
            </button>
          </div>
          {busyAction === `patch:${term.id}` ? (
            <p className="loading-status" role="status" aria-live="polite">
              <span className="loading-spinner" aria-hidden="true" />
              用語を更新しています
            </p>
          ) : null}
          <p className="small">
            登録元: {term.source_kind === "ai" ? "AI 自動" : "管理者手動"} / 関連記事: {term.article_count ?? 0} 件
          </p>
        </article>
      ))}
      <div className="infinite-sentinel" ref={sentinelRef} aria-hidden="true" />
      {loadingMore ? (
        <p className="loading-status" role="status">
          <span className="loading-spinner" aria-hidden="true" />
          用語を読み込んでいます
        </p>
      ) : null}
      {loadError ? (
        <div className="notice" role="alert">
          <p>{loadError}</p>
          <button className="button-secondary" type="button" onClick={() => void loadMore()}>
            再読み込み
          </button>
        </div>
      ) : null}
    </div>
  );
}
