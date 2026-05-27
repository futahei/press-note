import Link from "next/link";
import { getLatestTermEntries } from "@/lib/data";

export async function WidgetPanel() {
  const terms = await getLatestTermEntries(3);

  return (
    <aside className="side-pane" aria-label="補助情報">
      <section className="panel">
        <div className="panel-title">
          <span>最新の単語</span>
          <Link className="badge" href="/terms">
            一覧
          </Link>
        </div>
        <div className="term-grid">
          {terms.map((term) => (
            <div className="term-card" key={term.word}>
              <strong>{term.word}</strong>
              {term.reading ? <span className="muted">{term.reading}</span> : null}
              <span className="muted">{term.meaning}</span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
