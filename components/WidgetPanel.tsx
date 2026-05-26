import Image from "next/image";
import Link from "next/link";
import { Flame, Star } from "lucide-react";
import { getDailyTerms, getFeaturedCompanies, getTopicCounts } from "@/lib/data";

export function WidgetPanel() {
  const featured = getFeaturedCompanies();
  const tags = getTopicCounts(1).slice(0, 5);
  const trends = getTopicCounts(30).slice(0, 10);
  const terms = getDailyTerms();

  return (
    <aside className="side-pane" aria-label="補助情報">
      <section className="panel">
        <div className="panel-title">
          <span>注目企業</span>
          <Link className="muted" href="/companies">
            すべて見る
          </Link>
        </div>
        {featured.map(({ company }) => (
          <div className="company-item" key={company.id}>
            <Image src={company.logoUrl} width={32} height={32} alt="" />
            <div>
              <strong>{company.name}</strong>
              <div className="muted">{company.description}</div>
            </div>
            <Star size={18} color="#F59E0B" fill="#F59E0B" aria-hidden />
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="panel-title">
          <span>今日のタグ</span>
        </div>
        {tags.map((tag, index) => (
          <div className="rank-item" key={tag.tag}>
            <span className="rank-number">{index + 1}</span>
            <strong>{tag.tag}</strong>
            <span className="muted">{tag.count}件</span>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="panel-title">
          <span>単語帳</span>
          <Link className="badge" href="/terms">
            一覧
          </Link>
        </div>
        <div className="term-grid">
          {terms.slice(0, 3).map((term) => (
            <div className="term-card" key={term.word}>
              <strong>{term.word}</strong>
              <span className="muted">{term.meaning}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <span>タグランキング</span>
        </div>
        {trends.map((tag) => (
          <div className="rank-item" key={tag.tag}>
            <Flame size={18} color="#EF4444" aria-hidden />
            <strong>{tag.tag}</strong>
            <span className="muted">{tag.count * 18}件</span>
          </div>
        ))}
      </section>
    </aside>
  );
}
