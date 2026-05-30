import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportButton } from "@/components/ReportButton";
import { formatArticleDate } from "@/components/ArticleCard";
import { getArticle } from "@/lib/data";

export const revalidate = 60;

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  return (
    <main className="page">
      <article className="tile tile-light">
        <div className="container" style={{ display: "grid", gap: 24 }}>
          <div className="article-meta">
            {article.source?.name ?? "未設定ソース"} ・ {formatArticleDate(article)}
          </div>
          <h1 className="hero-title" style={{ textAlign: "left" }}>
            {article.title}
          </h1>
          <p className="lead">{article.summary}</p>
          <div className="button-row">
            <a className="button-primary" href={article.url} target="_blank" rel="noopener">
              本家リンク ↗
            </a>
            <ReportButton articleId={article.id} />
          </div>
          <section>
            <h2 className="section-title">抽出された用語</h2>
            <div className="chips" style={{ marginTop: 16 }}>
              {article.terms.map((term) => (
                <Link key={term.id} className="chip" href={`/terms/${term.id}`}>
                  {term.headword}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
