import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { NavRail } from "@/components/NavRail";
import { PressCard } from "@/components/PressCard";
import { TopBar } from "@/components/TopBar";
import { WidgetPanel } from "@/components/WidgetPanel";
import { getArticles, getTopicCounts } from "@/lib/data";

type HomeProps = {
  searchParams?: Promise<{
    q?: string;
    tag?: string;
    sort?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = (await searchParams) ?? {};
  const activeTag = params.tag ?? "すべて";
  const sort = params.sort ?? "latest";
  const articles = getArticles({ q: params.q, tag: activeTag, sort });
  const topTags = ["すべて", ...getTopicCounts(1).slice(0, 4).map((item) => item.tag)];

  return (
    <div className="app-shell">
      <NavRail currentPath="/" />
      <main className="main-pane">
        <TopBar defaultQuery={params.q ?? ""} />
        <div className="page-heading">
          <div>
            <h1>今日のプレスリリース</h1>
            <p className="muted">2026年5月26日（火）</p>
          </div>
          <Link className="button" href="/admin/sources/new">
            <Sparkles size={17} /> 監視ソースを追加
          </Link>
        </div>

        <div className="filters" aria-label="タグフィルタ">
          {topTags.map((tag) => (
            <Link key={tag} className={tag === activeTag ? "chip active" : "chip"} href={tag === "すべて" ? "/" : `/?tag=${encodeURIComponent(tag)}`}>
              {tag}
            </Link>
          ))}
        </div>

        <div className="segment-row">
          <Link className={sort === "latest" ? "chip active" : "chip"} href={{ pathname: "/", query: { ...params, sort: "latest" } }}>
            新着順
          </Link>
          <Link className={sort === "company" ? "chip active" : "chip"} href={{ pathname: "/", query: { ...params, sort: "company" } }}>
            企業順
          </Link>
        </div>

        <section className="article-list" aria-label="プレスリリース一覧">
          {articles.map((article) => (
            <PressCard key={article.id} article={article} />
          ))}
        </section>

        <nav className="pagination" aria-label="ページネーション">
          <span aria-hidden>
            <ChevronLeft size={16} />
          </span>
          <span className="current">1</span>
          <a href="/?page=2">2</a>
          <a href="/?page=3">3</a>
          <span>...</span>
          <a href="/?page=7">7</a>
          <a href="/?page=2" aria-label="次のページ">
            <ChevronRight size={16} />
          </a>
        </nav>
      </main>
      <WidgetPanel />
    </div>
  );
}

