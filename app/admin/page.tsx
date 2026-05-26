import Link from "next/link";
import { Activity, Bell, Database, Plus, WandSparkles } from "lucide-react";
import { NavRail } from "@/components/NavRail";
import { getArticles, getSources } from "@/lib/data";

export const metadata = {
  title: "管理ダッシュボード"
};

export default function AdminPage() {
  const articles = getArticles();
  const sources = getSources();
  const failures = sources.reduce((sum, source) => sum + source.failureCount, 0);

  return (
    <div className="app-shell">
      <NavRail currentPath="/admin" />
      <main className="main-pane admin-layout">
        <div className="page-heading">
          <div>
            <h1>管理ダッシュボード</h1>
            <p className="muted">24h / 7d の処理状況とソースの健全性。</p>
          </div>
          <Link className="button primary" href="/admin/sources/new">
            <Plus size={17} /> ソース追加
          </Link>
        </div>

        <section className="admin-stat-grid">
          <div className="admin-panel admin-stat">
            <Activity size={19} color="#2563EB" />
            <p className="muted">本日の記事</p>
            <h2>{articles.length}件</h2>
          </div>
          <div className="admin-panel admin-stat">
            <WandSparkles size={19} color="#10B981" />
            <p className="muted">AI 処理済み</p>
            <h2>{articles.filter((article) => article.aiProcessedAt).length}件</h2>
          </div>
          <div className="admin-panel admin-stat">
            <Bell size={19} color="#F59E0B" />
            <p className="muted">取得失敗</p>
            <h2>{failures}件</h2>
          </div>
          <div className="admin-panel admin-stat">
            <Database size={19} color="#475569" />
            <p className="muted">DB 使用率</p>
            <h2>3%</h2>
          </div>
        </section>

        <section className="admin-panel">
          <div className="panel-title">
            <span>ソース状態</span>
            <Link className="button" href="/admin/sources">
              一覧を開く
            </Link>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>ソース</th>
                <th>モード</th>
                <th>ヘルス</th>
                <th>7日検知</th>
                <th>失敗</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id}>
                  <td>{source.url}</td>
                  <td>{source.mode}</td>
                  <td>
                    <span className={`badge ${source.health === "ok" ? "rss" : source.health === "degraded" ? "scrape" : "pdf_link"}`}>
                      {source.health}
                    </span>
                  </td>
                  <td>{source.sevenDayCount}</td>
                  <td>{source.failureCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

