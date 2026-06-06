import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { NextCheckTime } from "@/components/NextCheckTime";
import { SubscribeBanner } from "@/components/SubscribeBanner";
import { countEnabledSources, getWordOfDay, listHomeArticles } from "@/lib/data";
import type { Article } from "@/lib/types";

export const revalidate = 60;

const dateDividerFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  month: "long",
  day: "numeric"
});

function articleDate(article: Article) {
  return new Date(article.published_at ?? article.fetched_at);
}

function groupArticlesByDate(articles: Article[]) {
  return articles.reduce<Array<{ label: string; articles: Article[] }>>((groups, article) => {
    const label = dateDividerFormatter.format(articleDate(article));
    const current = groups.at(-1);
    if (current?.label === label) {
      current.articles.push(article);
      return groups;
    }

    groups.push({ label, articles: [article] });
    return groups;
  }, []);
}

export default async function HomePage() {
  const [homeArticles, sourceCount, wordOfDay] = await Promise.all([
    listHomeArticles(),
    countEnabledSources(),
    getWordOfDay()
  ]);
  const articleGroups = groupArticlesByDate(homeArticles.articles);

  return (
    <main className="page">
      <section className="tile tile-parchment">
        <div className="container article-section">
          <div className="home-section-head">
            <div>
              <p className="section-kicker">今日から直近1週間</p>
              <h1 className="section-title">
                {homeArticles.hasRecentArticles ? "今日・この1週間のプレスリリース" : "この1週間のプレスリリースはありません"}
              </h1>
            </div>
            <Link className="button-secondary" href="/articles">
              すべての記事を見る
            </Link>
          </div>

          {articleGroups.length > 0 ? (
            <div className="article-date-groups">
              {articleGroups.map((group) => (
                <section key={group.label} className="article-date-group" aria-label={`${group.label}の記事`}>
                  <div className="date-divider">
                    <span>{group.label}</span>
                  </div>
                  <div className="grid">
                    {group.articles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>プレスリリースはまだ登録されていません</h2>
              <p>監視ソースの探索が完了すると、ここに直近1週間の記事が表示されます。</p>
            </div>
          )}
        </div>
      </section>

      <section className="tile tile-light">
        <div className="container home-dashboard">
          {wordOfDay ? (
            <section className="word-of-day" aria-labelledby="word-of-day-title">
              <div className="word-of-day-copy">
                <p className="section-kicker">日替わり用語ピックアップ</p>
                <h2 id="word-of-day-title">
                  {wordOfDay.headword}
                  {wordOfDay.reading ? <span>（{wordOfDay.reading}）</span> : null}
                </h2>
                <p>{wordOfDay.description}</p>
                <p className="small">記事の日付とは関係なく、用語帳から日替わりで紹介しています。</p>
              </div>
              <Link className="button-secondary" href={`/terms/${wordOfDay.id}`}>
                この用語が登場した記事を見る（{wordOfDay.article_count}件）
              </Link>
            </section>
          ) : (
            <section className="word-of-day word-of-day-empty" aria-labelledby="word-of-day-title">
              <div className="word-of-day-copy">
                <p className="section-kicker">日替わり用語ピックアップ</p>
                <h2 id="word-of-day-title">用語はまだ登録されていません</h2>
                <p>記事のAI解析が完了すると、用語帳から日替わりでひとつ表示されます。</p>
              </div>
            </section>
          )}

          <div className="status-header">
            <div className="status-copy">
              <span className="status-pill">{homeArticles.hasRecentArticles ? "1週間の動き" : "追いつきました"}</span>
              <h2>{homeArticles.hasRecentArticles ? "この1週間のプレスリリースを確認しました" : "この1週間のプレスリリースはありません"}</h2>
              <p>
                {homeArticles.hasRecentArticles ? (
                  "直近1週間に公開された記事を日付ごとに表示しています。"
                ) : (
                  <>
                    直近1週間の記事はありません。次回のチェックは <NextCheckTime /> です。
                  </>
                )}
              </p>
            </div>
            <div className="status-metric" aria-label={`現在 ${sourceCount} 社を監視中`}>
              <span>現在</span>
              <strong>{sourceCount}</strong>
              <span>社を監視中</span>
            </div>
          </div>

          <SubscribeBanner />
        </div>
      </section>
    </main>
  );
}
