import Link from "next/link";
import { ArrowUpRight, BookOpenText } from "lucide-react";
import { NavRail } from "@/components/NavRail";
import { TopBar } from "@/components/TopBar";
import { WidgetPanel } from "@/components/WidgetPanel";
import { getTermEntries } from "@/lib/data";

export const metadata = {
  title: "用語集"
};

export default function TermsPage() {
  const terms = getTermEntries();

  return (
    <div className="app-shell">
      <NavRail currentPath="/terms" />
      <main className="main-pane">
        <TopBar />
        <div className="page-heading">
          <div>
            <h1>用語集</h1>
            <p className="muted">AI がプレスリリースから抽出した専門用語と解説をまとめて確認できます。</p>
          </div>
          <span className="button">
            <BookOpenText size={17} /> {terms.length}語
          </span>
        </div>

        <section className="term-index" aria-label="用語解説一覧">
          {terms.map((term) => (
            <article className="term-entry" key={term.term}>
              <div className="term-entry-head">
                <div>
                  <h2>{term.term}</h2>
                  <p>{term.description}</p>
                </div>
                <span className="badge">{term.count}件</span>
              </div>

              <div className="related-article-list" aria-label={`${term.term} に関連するリリース`}>
                {term.articles.map((article) => (
                  <Link className="related-article" href={`/articles/${article.id}`} key={article.id}>
                    <span>
                      <strong>{article.companyName}</strong>
                      <span className="muted">{article.title}</span>
                    </span>
                    <ArrowUpRight size={17} aria-hidden />
                  </Link>
                ))}
              </div>

              <div className="tag-row">
                {[...new Set(term.articles.flatMap((article) => article.tags))].slice(0, 4).map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
      <WidgetPanel />
    </div>
  );
}
