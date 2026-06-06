import Link from "next/link";
import { listTermsPage } from "@/lib/data";
import { WordsManager } from "@/components/admin/WordsManager";
import { SubmitButton } from "@/components/SubmitButton";

function toSingleValueParams(params: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) => {
      if (key === "page" || key === "limit" || value == null) return [];
      return [[key, Array.isArray(value) ? value[0] ?? "" : value]];
    })
  );
}

export default async function AdminWordsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listParams = toSingleValueParams(params);
  const q = typeof params.q === "string" ? params.q : "";
  const { terms, total, page, limit, hasMore } = await listTermsPage({ ...listParams, limit: 24 });

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div>
        <h1 className="section-title">用語管理</h1>
        <p className="muted">AI 抽出語と管理者追加語を編集します。</p>
      </div>
      <form className="utility-card" action="/api/admin/words" method="post">
        <div className="form-grid">
          <label>
            <span className="small">見出し語</span>
            <input className="input" name="headword" required />
          </label>
          <label>
            <span className="small">読み方</span>
            <input className="input" name="reading" required />
          </label>
          <label style={{ gridColumn: "span 2" }}>
            <span className="small">解説</span>
            <input className="input" name="description" required />
          </label>
          <SubmitButton className="button-primary" pendingLabel="追加中">
            追加
          </SubmitButton>
        </div>
      </form>
      <form className="filter-row">
        <input className="input" name="q" defaultValue={q} placeholder="見出し語・読み方で検索" />
        <button className="button-primary" type="submit">
          検索
        </button>
        {q ? (
          <Link className="button-secondary" href="/admin/words">
            解除
          </Link>
        ) : null}
      </form>
      <WordsManager
        key={JSON.stringify(listParams)}
        initialTerms={terms}
        initialPage={page}
        initialLimit={limit}
        initialHasMore={hasMore}
        total={total}
        searchParams={listParams}
      />
    </div>
  );
}
