import { listArticles, listSources } from "@/lib/data";
import { InfiniteArticleList } from "@/components/InfiniteArticleList";

function toSingleValueParams(params: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) => {
      if (key === "page" || key === "limit" || value == null) return [];
      return [[key, Array.isArray(value) ? value[0] ?? "" : value]];
    })
  );
}

export default async function ArticlesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listParams = toSingleValueParams(params);
  const [{ articles, total, page, limit, hasMore }, sources] = await Promise.all([
    listArticles(listParams),
    listSources()
  ]);

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
          <InfiniteArticleList
            initialArticles={articles}
            initialPage={page}
            initialLimit={limit}
            initialHasMore={hasMore}
            total={total}
            searchParams={listParams}
          />
        </div>
      </section>
    </main>
  );
}
