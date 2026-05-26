import Image from "next/image";
import Link from "next/link";
import { Bookmark, ExternalLink } from "lucide-react";
import { getCompany, getDisplayDate } from "@/lib/data";
import type { Article } from "@/lib/types";

const modeLabel = {
  rss: "RSS",
  scrape: "SCRAPE",
  pdf_link: "PDF"
};

export function PressCard({ article }: { article: Article }) {
  const company = getCompany(article.companyId);

  return (
    <article className="press-card">
      <div className="logo-box">
        <Image src={company.logoUrl} alt={`${company.name} ロゴ`} width={58} height={58} />
      </div>
      <div>
        <div className="article-meta">
          <strong>{company.name}</strong>
          <span>{getDisplayDate(article)}</span>
          <span className={`badge ${article.fetchMode}`}>{modeLabel[article.fetchMode]}</span>
        </div>
        <Link href={`/articles/${article.id}`}>
          <h2>{article.title}</h2>
        </Link>
        <p className="summary">{article.summaryShort}</p>
        <div className="tag-row" aria-label="タグ">
          {article.tags.slice(0, 3).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="card-actions">
        <a
          className="icon-button"
          href={article.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="元リリースを開く"
          aria-label="元リリースを開く"
        >
          <ExternalLink size={18} />
        </a>
        <button className="icon-button" type="button" title="あとで読む" aria-label="あとで読む">
          <Bookmark size={18} />
        </button>
      </div>
    </article>
  );
}

