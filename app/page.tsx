import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
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

const ALL_TAG_LABEL = "\u3059\u3079\u3066";

export const revalidate = 60;

export default async function Home({ searchParams }: HomeProps) {
  const params = (await searchParams) ?? {};
  const activeTag = params.tag ?? ALL_TAG_LABEL;
  const sort = params.sort ?? "latest";
  const [articles, topicCounts] = await Promise.all([getArticles({ q: params.q, tag: activeTag, sort }), getTopicCounts(1)]);
  const topTags = [ALL_TAG_LABEL, ...topicCounts.slice(0, 4).map((item) => item.tag)];

  return (
    <div className="app-shell">
      <NavRail currentPath="/" />
      <main className="main-pane">
        <TopBar defaultQuery={params.q ?? ""} />
        <div className="page-heading">
          <div>
            <h1>今日のプレスリリース</h1>
            <p className="muted">登録ソースから取得した最新記事を表示します。</p>
          </div>
          <Link className="button" href="/admin/sources/new">
            <Sparkles size={17} /> 監視ソースを追加
          </Link>
        </div>

        <div className="filters" aria-label="タグフィルタ">
          {topTags.map((tag) => (
            <Link key={tag} className={tag === activeTag ? "chip active" : "chip"} href={tag === ALL_TAG_LABEL ? "/" : `/?tag=${encodeURIComponent(tag)}`}>
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

        {articles.length > 0 ? (
          <section className="article-list" aria-label="プレスリリース一覧">
            {articles.map((article) => (
              <PressCard key={article.id} article={article} />
            ))}
          </section>
        ) : (
          <EmptyState
            title="今日のプレスリリースはまだありません"
            description="監視ソースが未登録、または条件に一致する記事がまだ取得されていません。"
            actionHref="/admin/sources/new"
            actionLabel="監視ソースを追加"
          />
        )}

        {articles.length > 0 ? (
          <nav className="pagination" aria-label="ページネーション">
            <span aria-hidden>
              <ChevronLeft size={16} />
            </span>
            <span className="current">1</span>
            <Link href="/?page=2">2</Link>
            <Link href="/?page=3">3</Link>
            <span>...</span>
            <Link href="/?page=7">7</Link>
            <Link href="/?page=2" aria-label="次のページ">
              <ChevronRight size={16} />
            </Link>
          </nav>
        ) : null}
      </main>
      <WidgetPanel />
    </div>
  );
}
