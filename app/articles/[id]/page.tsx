import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { NavRail } from "@/components/NavRail";
import { WidgetPanel } from "@/components/WidgetPanel";
import { getArticle, getDisplayDate } from "@/lib/data";

type ArticlePageProps = {
  params: Promise<{ id: string }>;
};

const modeLabel = {
  rss: "RSS",
  scrape: "SCRAPE",
  pdf_link: "PDF"
};

export const revalidate = 60;

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) {
    return { title: "記事が見つかりません" };
  }
  return {
    title: article.title,
    description: article.summaryShort,
    openGraph: {
      title: article.title,
      description: article.summaryShort,
      type: "article"
    }
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) {
    notFound();
  }
  const company = article.company;

  return (
    <div className="app-shell">
      <NavRail currentPath="/articles" />
      <main className="main-pane">
        <div className="top-bar">
          <Link className="button" href="/">
            <ArrowLeft size={17} /> 一覧へ戻る
          </Link>
        </div>

        <div className="detail-layout">
          <article className="detail-article">
            <div className="article-meta">
              <strong>{company.name}</strong>
              <span>{getDisplayDate(article)}</span>
              <span className={`badge ${article.fetchMode}`}>{modeLabel[article.fetchMode]}</span>
            </div>
            <h1 className="detail-title">{article.title}</h1>
            <p className="summary">{article.summaryShort}</p>

            <div className="segment-row">
              <a className="button primary" href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={17} /> 元リリースを読む
              </a>
              {article.pdfUrl ? (
                <a className="button" href={article.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <FileText size={17} /> PDFを開く
                </a>
              ) : null}
            </div>

            <section className="detail-section">
              <h2 className="section-title">AI 要約</h2>
              <p>{article.summaryLong}</p>
            </section>

            <section className="detail-section">
              <h2 className="section-title">単語帳</h2>
              <div className="term-grid">
                {article.words.map((term) => (
                  <div className="term-card" key={term.word}>
                    <strong>{term.word}</strong>
                    {term.reading ? <span className="muted">{term.reading}</span> : null}
                    <span className="muted">{term.meaning}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="detail-section">
              <h2 className="section-title">タグ</h2>
              <div className="tag-row">
                {article.tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          </article>
        </div>
      </main>
      <WidgetPanel />
    </div>
  );
}
