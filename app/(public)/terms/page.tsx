import Link from "next/link";
import { listTerms } from "@/lib/data";

const initials = ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ"];

function termsHref({ initial, q }: { initial?: string; q?: string }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (initial) params.set("initial", initial);
  const query = params.toString();
  return query ? `/terms?${query}` : "/terms";
}

export default async function TermsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const terms = await listTerms(params);
  const selectedInitial = typeof params.initial === "string" ? params.initial : "";
  const q = typeof params.q === "string" ? params.q : "";

  return (
    <main className="page">
      <section className="tile tile-light">
        <div className="container" style={{ display: "grid", gap: 28 }}>
          <div>
            <h1 className="section-title">用語帳</h1>
            <p className="muted">読み方ベースの 50 音順で整理しています。</p>
          </div>
          <form className="filter-row">
            <input className="input" name="q" defaultValue={String(params.q ?? "")} placeholder="見出し語・読み方" />
            <button className="button-primary" type="submit">
              検索
            </button>
          </form>
          <nav className="term-index" aria-label="頭文字">
            {initials.map((initial) => (
              <Link
                key={initial}
                aria-current={selectedInitial === initial ? "page" : undefined}
                className={selectedInitial === initial ? "chip chip-selected" : "chip"}
                href={termsHref({ initial: selectedInitial === initial ? undefined : initial, q })}
              >
                {initial}
              </Link>
            ))}
          </nav>
          <div className="grid">
            {terms.map((term) => (
              <article className="utility-card" key={term.id}>
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
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
