"use client";

import { Check, WandSparkles } from "lucide-react";
import { useState } from "react";
import type { SourceMode, SourceSelectors, SourceCandidate } from "@/lib/content";

type AnalyzeResult = {
  mode: SourceMode;
  sourceUrl: string;
  feedUrl?: string;
  companyName: string;
  companyLogoUrl: string;
  selectors: SourceSelectors;
  confidence: number;
  notes: string;
  preview: SourceCandidate[];
};

export function SourceWizardClient() {
  const [url, setUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [mode, setMode] = useState<SourceMode>("scrape");
  const [backfillLimit, setBackfillLimit] = useState(5);
  const [selectors, setSelectors] = useState<SourceSelectors>({});
  const [preview, setPreview] = useState<SourceCandidate[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function analyze() {
    if (!url.trim()) {
      setMessage("URLを入力してください。");
      return;
    }

    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/sources/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() })
    });
    setBusy(false);

    if (!response.ok) {
      setMessage("解析に失敗しました。URLと対象ページを確認してください。");
      return;
    }

    const result = (await response.json()) as { data: AnalyzeResult };
    setMode(result.data.mode);
    setUrl(result.data.mode === "rss" && result.data.feedUrl ? result.data.feedUrl : result.data.sourceUrl);
    setCompanyName(result.data.companyName);
    setCompanyLogoUrl(result.data.companyLogoUrl);
    setSelectors(result.data.selectors);
    setPreview(result.data.preview);
    setMessage(result.data.notes);
  }

  async function save() {
    if (!url.trim() || !companyName.trim()) {
      setMessage("URLと企業名を入力してください。");
      return;
    }

    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: url.trim(),
        companyName: companyName.trim(),
        companyLogoUrl: companyLogoUrl.trim() || undefined,
        mode,
        selectors,
        backfillLimit
      })
    });
    setBusy(false);

    if (!response.ok) {
      setMessage("保存に失敗しました。Supabase設定と入力内容を確認してください。");
      return;
    }

    const result = (await response.json()) as { data: { crawl?: { itemsFound: number; itemsNew: number } } };
    const crawl = result.data.crawl;
    setMessage(crawl ? `保存しました。初回取得: ${crawl.itemsFound}件検出 / ${crawl.itemsNew}件追加。` : "保存しました。");
  }

  return (
    <section className="admin-panel form-grid">
      <label className="field">
        <span>監視対象 URL</span>
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/news" type="url" />
      </label>
      <div className="admin-stat-grid">
        <label className="field admin-stat">
          <span>企業名</span>
          <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="株式会社サンプル" />
        </label>
        <label className="field admin-stat">
          <span>取得方式</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as SourceMode)}>
            <option value="scrape">スクレイピング</option>
            <option value="rss">RSS / Atom</option>
            <option value="pdf_link">PDFリンク</option>
          </select>
        </label>
      </div>
      <div className="admin-stat-grid">
        <label className="field admin-stat">
          <span>ロゴURL</span>
          <input value={companyLogoUrl} onChange={(event) => setCompanyLogoUrl(event.target.value)} placeholder="https://example.com/favicon.png" />
        </label>
        <label className="field admin-stat">
          <span>初回バックフィル</span>
          <select value={backfillLimit} onChange={(event) => setBackfillLimit(Number(event.target.value))}>
            <option value="0">0件</option>
            <option value="5">5件</option>
            <option value="10">10件</option>
            <option value="20">20件</option>
          </select>
        </label>
      </div>
      <div className="segment-row">
        <button className="button primary" type="button" onClick={analyze} disabled={busy}>
          <WandSparkles size={17} /> AI解析を実行
        </button>
        <button className="button" type="button" onClick={save} disabled={busy}>
          <Check size={17} /> 保存
        </button>
      </div>
      {message ? <p className="muted">{message}</p> : null}
      {preview.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>プレビュー</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((item) => (
              <tr key={item.url}>
                <td>{item.title}</td>
                <td>{item.url}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
