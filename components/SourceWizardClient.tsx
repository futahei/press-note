"use client";

import { ArrowLeft, Check, MousePointerClick, RefreshCw, WandSparkles } from "lucide-react";
import { type MouseEvent, useMemo, useState } from "react";
import type { FlatSourceSelectors, PipelineSourceSelectors, SourceCandidate, SourceMode, SourceSelectors } from "@/lib/content";

type AnalyzeResult = {
  mode: SourceMode;
  sourceUrl: string;
  feedUrl?: string;
  companyName: string;
  companyLogoUrl: string;
  selectors: SourceSelectors;
  previewHtml: string;
  confidence: number;
  notes: string;
  preview: SourceCandidate[];
};

type SelectorPath = "list.item" | "list.date" | "list.title" | "list.url" | "detail.body" | "detail.followLinks.0";

const defaultPipelineSelectors: PipelineSourceSelectors = {
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

const selectorFields: Array<{ path: SelectorPath; label: string; help: string }> = [
  { path: "list.item", label: "記事要素", help: "一覧内で1記事を表す外側の要素" },
  { path: "list.date", label: "日付要素", help: "記事要素の中にある公開日" },
  { path: "list.title", label: "タイトル要素", help: "記事要素の中にあるタイトル" },
  { path: "list.url", label: "記事へのURL", help: "本文ページへ遷移するリンク" },
  { path: "detail.body", label: "本文要素", help: "遷移先ページで本文を含む要素" },
  { path: "detail.followLinks.0", label: "追加遷移/PDF", help: "本文ページ内でさらに読むリンクやPDFリンク" }
];

function toPipelineSelectors(selectors?: SourceSelectors): PipelineSourceSelectors {
  if (selectors && "list" in selectors && "detail" in selectors) {
    return {
      list: {
        item: selectors.list.item || defaultPipelineSelectors.list.item,
        title: selectors.list.title || defaultPipelineSelectors.list.title,
        date: selectors.list.date || defaultPipelineSelectors.list.date,
        url: selectors.list.url || defaultPipelineSelectors.list.url
      },
      detail: {
        body: selectors.detail.body || defaultPipelineSelectors.detail.body,
        followLinks: selectors.detail.followLinks?.length ? selectors.detail.followLinks : defaultPipelineSelectors.detail.followLinks
      }
    };
  }

  const flat = (selectors ?? {}) as FlatSourceSelectors;
  return {
    list: {
      item: flat.item || defaultPipelineSelectors.list.item,
      title: flat.title || defaultPipelineSelectors.list.title,
      date: flat.published_at || defaultPipelineSelectors.list.date,
      url: flat.url || defaultPipelineSelectors.list.url
    },
    detail: {
      body: flat.body || defaultPipelineSelectors.detail.body,
      followLinks: flat.pdf_link ? [flat.pdf_link] : defaultPipelineSelectors.detail.followLinks
    }
  };
}

function getSelectorValue(selectors: PipelineSourceSelectors, path: SelectorPath) {
  if (path === "detail.followLinks.0") {
    return selectors.detail.followLinks?.[0] ?? "";
  }
  const [section, key] = path.split(".") as ["list" | "detail", string];
  return section === "list" ? selectors.list[key as keyof PipelineSourceSelectors["list"]] : selectors.detail[key as keyof PipelineSourceSelectors["detail"]] ?? "";
}

function setSelectorValue(selectors: PipelineSourceSelectors, path: SelectorPath, value: string): PipelineSourceSelectors {
  if (path === "detail.followLinks.0") {
    return { ...selectors, detail: { ...selectors.detail, followLinks: value.trim() ? [value.trim()] : [] } };
  }
  if (path.startsWith("list.")) {
    const key = path.replace("list.", "") as keyof PipelineSourceSelectors["list"];
    return { ...selectors, list: { ...selectors.list, [key]: value } };
  }
  return { ...selectors, detail: { ...selectors.detail, body: value } };
}

function cssPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function baseSelectorForElement(element: HTMLElement) {
  if (element.id) {
    return `#${cssPart(element.id)}`;
  }

  const classes = Array.from(element.classList).filter((className) => className && !className.startsWith("js-"));
  if (classes[0]) {
    return `.${cssPart(classes[0])}`;
  }

  return element.tagName.toLowerCase();
}

function selectorForElement(element: HTMLElement, path: SelectorPath) {
  if (path === "list.url") {
    const link = element.closest("a[href]");
    if (link instanceof HTMLElement) {
      return baseSelectorForElement(link);
    }
  }

  if (path === "list.item") {
    const item = element.closest("article, li, .news-article, [class*='article'], [class*='news']");
    if (item instanceof HTMLElement) {
      return baseSelectorForElement(item);
    }
  }

  return baseSelectorForElement(element);
}

export function SourceWizardClient() {
  const [step, setStep] = useState<"input" | "configure">("input");
  const [url, setUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [mode, setMode] = useState<SourceMode>("scrape");
  const [backfillLimit, setBackfillLimit] = useState(5);
  const [selectors, setSelectors] = useState<PipelineSourceSelectors>(defaultPipelineSelectors);
  const [activePath, setActivePath] = useState<SelectorPath>("list.item");
  const [previewHtml, setPreviewHtml] = useState("");
  const [preview, setPreview] = useState<SourceCandidate[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activeField = useMemo(() => selectorFields.find((field) => field.path === activePath), [activePath]);

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
    setCompanyName((current) => current || result.data.companyName);
    setCompanyLogoUrl(result.data.companyLogoUrl);
    setSelectors(toPipelineSelectors(result.data.selectors));
    setPreviewHtml(result.data.previewHtml);
    setPreview(result.data.preview);
    setMessage(result.data.notes);
    setStep("configure");
  }

  async function refreshPreview() {
    if (!url.trim()) {
      setMessage("URLを入力してください。");
      return;
    }

    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/admin/sources/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), mode, selectors })
    });
    setBusy(false);

    if (!response.ok) {
      setMessage("抽出プレビューに失敗しました。セレクタを確認してください。");
      return;
    }

    const result = (await response.json()) as { data: { preview: SourceCandidate[] } };
    setPreview(result.data.preview);
    setMessage(`抽出プレビューを更新しました。${result.data.preview.length}件を検出しました。`);
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

  function selectFromPreview(event: MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target;
    if (!(target instanceof HTMLElement) || target === event.currentTarget) {
      return;
    }

    const selector = selectorForElement(target, activePath);
    setSelectors((current) => setSelectorValue(current, activePath, selector));
    setMessage(`${activeField?.label ?? "対象"} に ${selector} を設定しました。`);
  }

  if (step === "input") {
    return (
      <section className="admin-panel form-grid">
        <label className="field">
          <span>対象企業名</span>
          <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="株式会社サンプル" />
        </label>
        <label className="field">
          <span>スクレイピング対象URL</span>
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/news" type="url" />
        </label>
        <div className="segment-row">
          <button className="button primary" type="button" onClick={analyze} disabled={busy}>
            <WandSparkles size={17} /> 登録作業に入る
          </button>
        </div>
        {message ? <p className="muted">{message}</p> : null}
      </section>
    );
  }

  return (
    <section className="admin-panel form-grid">
      <div className="segment-row">
        <button className="button" type="button" onClick={() => setStep("input")} disabled={busy}>
          <ArrowLeft size={17} /> 入力へ戻る
        </button>
        <button className="button" type="button" onClick={refreshPreview} disabled={busy}>
          <RefreshCw size={17} /> 抽出プレビュー
        </button>
        <button className="button primary" type="button" onClick={save} disabled={busy}>
          <Check size={17} /> 保存
        </button>
      </div>

      <div className="admin-stat-grid">
        <label className="field admin-stat">
          <span>企業名</span>
          <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
        </label>
        <label className="field admin-stat">
          <span>監視対象URL</span>
          <input value={url} onChange={(event) => setUrl(event.target.value)} type="url" />
        </label>
      </div>
      <div className="admin-stat-grid">
        <label className="field admin-stat">
          <span>取得方式</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as SourceMode)}>
            <option value="scrape">スクレイピング</option>
            <option value="rss">RSS / Atom</option>
            <option value="pdf_link">PDFリンク</option>
          </select>
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

      <div className="scrape-workspace">
        <div className="selector-panel">
          <div className="panel-title">
            <span>取得対象</span>
            <MousePointerClick size={18} />
          </div>
          <div className="selector-buttons">
            {selectorFields.map((field) => (
              <button key={field.path} className={`selector-button ${activePath === field.path ? "active" : ""}`} type="button" onClick={() => setActivePath(field.path)}>
                <span>{field.label}</span>
                <small>{field.help}</small>
              </button>
            ))}
          </div>
          <div className="form-grid">
            {selectorFields.map((field) => (
              <label className="field" key={field.path}>
                <span>{field.label}</span>
                <input value={getSelectorValue(selectors, field.path)} onChange={(event) => setSelectors((current) => setSelectorValue(current, field.path, event.target.value))} />
              </label>
            ))}
          </div>
        </div>

        <div className="scrape-browser">
          <div className="scrape-browser-bar">
            <span>{activeField?.label}をクリックで選択</span>
            <code>{getSelectorValue(selectors, activePath)}</code>
          </div>
          <div className="scrape-browser-body" onClick={selectFromPreview} dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
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
      ) : (
        <div className="empty-state">
          <h2>抽出できた記事がありません</h2>
          <p>記事要素、タイトル要素、記事へのURLを選び直してから抽出プレビューを実行してください。</p>
        </div>
      )}
    </section>
  );
}
