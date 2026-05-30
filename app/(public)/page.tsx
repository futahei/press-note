import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { SubscribeBanner } from "@/components/SubscribeBanner";
import { listRecentArticles } from "@/lib/data";

export const revalidate = 60;

export default async function HomePage() {
  const articles = await listRecentArticles();

  return (
    <main className="page">
      <section className="tile tile-light">
        <div className="hero-stack">
          <h1 className="hero-title">最新のプレスリリース</h1>
          <p className="lead">直近 24 時間</p>
          <Link className="button-primary" href="/articles">
            過去の記事を見る
          </Link>
        </div>
      </section>
      <section className="tile tile-parchment">
        <div className="container" style={{ display: "grid", gap: 24 }}>
          <SubscribeBanner />
          <div className="grid">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          {articles.length === 0 ? <p className="muted">直近 24 時間のプレスリリースはありません。</p> : null}
        </div>
      </section>
    </main>
  );
}
