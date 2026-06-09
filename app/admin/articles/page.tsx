import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { formatArticleDate } from "@/components/ArticleCard";
import { ExternalLinkIcon } from "@/components/Icons";
import { listArticles, listSources } from "@/lib/data";

function toSingleValueParams(params: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) => {
      if (key === "page" || key === "limit" || key === "retry" || value == null) return [];
      return [[key, Array.isArray(value) ? value[0] ?? "" : value]];
    })
  );
}

function retryMessage(status?: string | string[]) {
  const value = Array.isArray(status) ? status[0] : status;
  if (value === "success") return { role: "status" as const, text: "再要約が完了しました。" };
  if (value === "unavailable") return { role: "alert" as const, text: "Supabase が設定されていないため再要約できません。" };
  if (value === "error") {
    return {
      role: "alert" as const,
      text: "再要約に失敗しました。URL、OpenAI 設定、対象ページがプレスリリース本文かを確認してください。"
    };
  }
  return null;
}

export default async function AdminArticlesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listParams = toSingleValueParams(params);
  const [{ articles, total }, sources] = await Promise.all([listArticles({ ...listParams, limit: 50 }), listSources()]);
  const message = retryMessage(params.retry);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1 className="section-title">記事管理</h1>
        <p className="muted">要約や取得内容に問題がある記事を、対象URLを指定して再要約できます。</p>
      </div>

      {message ? (
        <p className={message.role === "alert" ? "notice form-error" : "notice"} role={message.role}>
          {message.text}
        </p>
      ) : null}

      <section className="utility-card">
        <form className="form-grid">
          <label>
            <span className="small">検索</span>
            <input className="input" name="q" defaultValue={String(params.q ?? "")} placeholder="タイトル・要約" />
          </label>
          <label>
            <span className="small">企業</span>
            <select className="select" name="source" defaultValue={String(params.source ?? "")}>
              <option value="">すべて</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="small">開始日</span>
            <input className="input" type="date" name="from" defaultValue={String(params.from ?? "")} />
          </label>
          <label>
            <span className="small">終了日</span>
            <input className="input" type="date" name="to" defaultValue={String(params.to ?? "")} />
          </label>
          <button className="button-primary" type="submit">
            絞り込む
          </button>
        </form>
      </section>

      <div className="admin-list">
        <p className="small">
          {total} 件中 {articles.length} 件を表示
        </p>
        {articles.map((article) => (
          <article className="utility-card" key={article.id}>
            <div className="article-meta">
              {article.source?.name ?? "未設定ソース"} ・ {formatArticleDate(article)}
            </div>
            <h2 className="card-title">{article.title}</h2>
            <p>{article.summary}</p>
            <form className="form-grid" action={`/api/admin/articles/${article.id}/retry`} method="post">
              <label style={{ gridColumn: "span 3" }}>
                <span className="small">再要約対象URL</span>
                <input className="input" type="url" name="url" defaultValue={article.url} required />
              </label>
              <div className="button-row">
                <SubmitButton className="button-primary" pendingLabel="再要約中">
                  再要約
                </SubmitButton>
                <Link className="button-secondary" href={`/articles/${article.id}`}>
                  記事を見る
                </Link>
                <a className="icon-button" href={article.url} target="_blank" rel="noopener" aria-label="本家リンクを開く">
                  <ExternalLinkIcon size={17} />
                </a>
              </div>
            </form>
          </article>
        ))}
        {articles.length === 0 ? <p className="muted">対象の記事はありません。</p> : null}
      </div>
    </div>
  );
}
