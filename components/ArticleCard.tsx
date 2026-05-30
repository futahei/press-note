import Link from "next/link";
import { ExternalLinkIcon } from "@/components/Icons";
import type { Article } from "@/lib/types";
import { ReportButton } from "@/components/ReportButton";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short"
});

export function formatArticleDate(article: Pick<Article, "published_at" | "fetched_at">) {
  return dateFormatter.format(new Date(article.published_at ?? article.fetched_at));
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="article-card">
      <div className="article-meta">
        {article.source?.name ?? "未設定ソース"} ・ {formatArticleDate(article)}
      </div>
      <h3>
        <Link href={`/articles/${article.id}`} className="text-link">
          {article.title}
        </Link>
      </h3>
      <p>{article.summary}</p>
      <div className="article-actions">
        <a className="button-secondary" href={article.url} target="_blank" rel="noopener">
          <ExternalLinkIcon size={17} />
          <span>本家リンク</span>
        </a>
      </div>
      <ReportButton articleId={article.id} />
    </article>
  );
}
