import Link from "next/link";
import { InfiniteTermList } from "@/components/InfiniteTermList";
import { listTermsPage } from "@/lib/data";

const initials = ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ"];

function termsHref({ initial, q }: { initial?: string; q?: string }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (initial) params.set("initial", initial);
  const query = params.toString();
  return query ? `/terms?${query}` : "/terms";
}

function toSingleValueParams(params: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) => {
      if (key === "page" || key === "limit" || value == null) return [];
      return [[key, Array.isArray(value) ? value[0] ?? "" : value]];
    })
  );
}

export default async function TermsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listParams = toSingleValueParams(params);
  const { terms, total, page, limit, hasMore } = await listTermsPage(listParams);
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
          <InfiniteTermList
            initialTerms={terms}
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
