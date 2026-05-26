import Image from "next/image";
import { Flame, Star } from "lucide-react";
import { getDailyTerms, getFeaturedCompanies, getTopicCounts } from "@/lib/data";

export function WidgetPanel() {
  const featured = getFeaturedCompanies();
  const topics = getTopicCounts(1).slice(0, 5);
  const trends = getTopicCounts(30).slice(0, 10);
  const terms = getDailyTerms();

  return (
    <aside className="side-pane" aria-label="補助情報">
      <section className="panel">
        <div className="panel-title">
          <span>注目企業</span>
          <a className="muted" href="/companies">
            すべて見る
          </a>
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
          <span>今日のトピック</span>
        </div>
        {topics.map((topic, index) => (
          <div className="rank-item" key={topic.tag}>
            <span className="rank-number">{index + 1}</span>
            <strong>{topic.tag}</strong>
            <span className="muted">{topic.count}件</span>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="panel-title">
          <span>用語解説</span>
          <span className="badge">注目</span>
        </div>
        <div className="term-grid">
          {terms.slice(0, 3).map((term) => (
            <div className="term-card" key={term.term}>
              <strong>{term.term}</strong>
              <span className="muted">{term.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <span>トレンドタグ</span>
        </div>
        {trends.map((topic) => (
          <div className="rank-item" key={topic.tag}>
            <Flame size={18} color="#EF4444" aria-hidden />
            <strong>{topic.tag}</strong>
            <span className="muted">{topic.count * 18}件</span>
          </div>
        ))}
      </section>
    </aside>
  );
}

