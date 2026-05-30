"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PreviewArticle } from "@/lib/schemas";
import type { Source } from "@/lib/types";

type Draft = {
  name: string;
  url: string;
  initialImportCount: number;
};

export function SourcesManager({ sources }: { sources: Source[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({ name: "", url: "", initialImportCount: 0 });
  const [preview, setPreview] = useState<PreviewArticle[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function previewSource() {
    setBusy(true);
    setMessage("");
    setPreview([]);
    const response = await fetch("/api/admin/sources/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft)
    });
    setBusy(false);

    if (!response.ok) {
      setMessage("プレビューに失敗しました。URL と OpenAI 設定を確認してください。");
      return;
    }

    const data = (await response.json()) as { articles: PreviewArticle[]; discovered: number };
    setPreview(data.articles);
    setMessage(`${data.discovered} 件の候補から ${data.articles.length} 件をプレビューしました。`);
  }

  async function saveSource() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...draft, enabled: true, previewArticles: preview })
    });
    setBusy(false);

    if (!response.ok) {
      setMessage("保存に失敗しました。");
      return;
    }

    setDraft({ name: "", url: "", initialImportCount: 0 });
    setPreview([]);
    setMessage("保存しました。");
    router.refresh();
  }

  async function patchSource(id: string, payload: Partial<Pick<Source, "name" | "url" | "enabled">>) {
    const response = await fetch(`/api/admin/sources/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (response.ok) router.refresh();
  }

  async function deleteSource(id: string) {
    if (!confirm("このソースを削除しますか。関連する記事も削除されます。")) return;
    const response = await fetch(`/api/admin/sources/${id}`, { method: "DELETE" });
    if (response.ok) router.refresh();
  }

  return (
    <>
      <section className="utility-card">
        <div>
          <h2 className="card-title">新規登録</h2>
          <p className="muted">初回取り込み件数を指定すると、保存前に候補記事を要約して確認できます。</p>
        </div>
        <div className="form-grid">
          <label>
            <span className="small">企業名</span>
            <input
              className="input"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>
          <label>
            <span className="small">URL</span>
            <input
              className="input"
              type="url"
              value={draft.url}
              onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
              required
            />
          </label>
          <label>
            <span className="small">初回取り込み</span>
            <select
              className="select"
              value={draft.initialImportCount}
              onChange={(event) =>
                setDraft((current) => ({ ...current, initialImportCount: Number(event.target.value) }))
              }
            >
              <option value="0">0 件</option>
              <option value="5">5 件</option>
              <option value="10">10 件</option>
              <option value="20">20 件</option>
            </select>
          </label>
          <div className="button-row">
            <button
              className="button-secondary"
              type="button"
              onClick={previewSource}
              disabled={busy || !draft.name || !draft.url || draft.initialImportCount === 0}
            >
              プレビュー
            </button>
            <button
              className="button-primary"
              type="button"
              onClick={saveSource}
              disabled={busy || !draft.name || !draft.url || (draft.initialImportCount > 0 && preview.length === 0)}
            >
              保存
            </button>
          </div>
        </div>
        {message ? <p className="small" role="status">{message}</p> : null}
        {preview.length > 0 ? (
          <div className="preview-list" aria-label="初回取り込みプレビュー">
            {preview.map((article) => (
              <article className="preview-item" key={article.url}>
                <strong>{article.title}</strong>
                <p>{article.summary}</p>
                <a className="text-link" href={article.url} target="_blank" rel="noopener">
                  {article.url}
                </a>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <div className="admin-list">
        {sources.map((source) => (
          <article className="utility-card" key={source.id}>
            <div className="form-grid">
              <label>
                <span className="small">企業名</span>
                <input
                  className="input"
                  defaultValue={source.name}
                  onBlur={(event) => {
                    if (event.target.value !== source.name) patchSource(source.id, { name: event.target.value });
                  }}
                />
              </label>
              <label style={{ gridColumn: "span 2" }}>
                <span className="small">URL</span>
                <input
                  className="input"
                  defaultValue={source.url}
                  onBlur={(event) => {
                    if (event.target.value !== source.url) patchSource(source.id, { url: event.target.value });
                  }}
                />
              </label>
              <div className="button-row">
                <button className="button-secondary" type="button" onClick={() => patchSource(source.id, { enabled: !source.enabled })}>
                  {source.enabled ? "無効化" : "有効化"}
                </button>
                <button className="button-rect" type="button" onClick={() => deleteSource(source.id)}>
                  削除
                </button>
              </div>
            </div>
            <p className="small">
              状態: {source.enabled ? "有効" : "無効"} / 最終クロール:{" "}
              {source.last_crawled_at ? new Date(source.last_crawled_at).toLocaleString("ja-JP") : "未実行"}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
