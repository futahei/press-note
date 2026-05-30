import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { listArticles, listSources } from "@/lib/data";

export default async function ArticlesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [{ articles, total, page }, sources] = await Promise.all([listArticles(params), listSources()]);
  const nextPage = page + 1;
  const previousPage = Math.max(1, page - 1);

  return (
    <main className="page">
      <section className="tile tile-light">
        <div className="container" style={{ display: "grid", gap: 28 }}>
          <div>
            <h1 className="section-title">過去記事</h1>
            <p className="muted">全期間のプレスリリースを検索できます。</p>
          </div>
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
          <p className="small">{total} 件</p>
          <div className="grid">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          <div className="button-row">
            {page > 1 ? (
              <Link className="button-secondary" href={`/articles?page=${previousPage}`}>
                前へ
              </Link>
            ) : null}
            {page * 30 < total ? (
              <Link className="button-primary" href={`/articles?page=${nextPage}`}>
                次へ
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
