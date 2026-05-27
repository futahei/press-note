import Link from "next/link";
import { ArrowUpRight, BookOpenText } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { NavRail } from "@/components/NavRail";
import { WidgetPanel } from "@/components/WidgetPanel";
import { getTermEntries } from "@/lib/data";

export const metadata = {
  title: "単語帳"
};

export const revalidate = 60;

export default async function TermsPage() {
  const terms = await getTermEntries();

  return (
    <div className="app-shell">
      <NavRail currentPath="/terms" />
      <main className="main-pane">
        <div className="page-heading">
          <div>
            <h1>単語帳</h1>
            <p className="muted">AI が記事解析時に登録した単語、読み、独立した意味、タグを確認できます。</p>
          </div>
          <span className="button">
            <BookOpenText size={17} /> {terms.length}語
          </span>
        </div>

        {terms.length > 0 ? (
          <section className="term-index" aria-label="単語帳一覧">
            {terms.map((term) => (
              <article className="term-entry" key={term.word}>
                <div className="term-entry-head">
                  <div>
                    <h2>{term.word}</h2>
                    {term.reading ? <div className="term-reading">{term.reading}</div> : null}
                    <p>{term.meaning}</p>
                  </div>
                  <span className="badge">{term.count}件</span>
                </div>

                <div className="related-article-list" aria-label={`${term.word} に関連する最新リリース`}>
                  {term.articles.slice(0, 3).map((article) => (
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
                  {term.tags.map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <EmptyState title="単語がまだ登録されていません" description="記事のAI解析が完了すると、抽出された単語・読み・意味・タグがここに表示されます。" />
        )}
      </main>
      <WidgetPanel />
    </div>
  );
}
