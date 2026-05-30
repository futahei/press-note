import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { getTerm } from "@/lib/data";

export const revalidate = 60;

export default async function TermDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const term = await getTerm(id);
  if (!term) notFound();

  return (
    <main className="page">
      <section className="tile tile-light">
        <div className="container" style={{ display: "grid", gap: 28 }}>
          <div>
            <p className="muted">{term.reading}</p>
            <h1 className="hero-title" style={{ textAlign: "left" }}>
              {term.headword}
            </h1>
          </div>
          <p className="lead">{term.description}</p>
          <section>
            <h2 className="section-title">この用語が登場した記事</h2>
            <div className="grid" style={{ marginTop: 20 }}>
              {term.articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
