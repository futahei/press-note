import Link from "next/link";
import { Plus } from "lucide-react";
import { NavRail } from "@/components/NavRail";
import { getSources } from "@/lib/data";

export const metadata = {
  title: "ソース管理"
};

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const sources = await getSources();

  return (
    <div className="app-shell">
      <NavRail currentPath="/admin" />
      <main className="main-pane admin-layout">
        <div className="page-heading">
          <div>
            <h1>ソース管理</h1>
            <p className="muted">監視対象サイト、抽出方式、健全性を管理します。</p>
          </div>
          <Link className="button primary" href="/admin/sources/new">
            <Plus size={17} /> 新規追加
          </Link>
        </div>
        <section className="admin-panel">
          <table className="table">
            <thead>
              <tr>
                <th>企業</th>
                <th>URL</th>
                <th>モード</th>
                <th>最終取得</th>
                <th>状態</th>
                <th>有効</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id}>
                  <td>{source.companyName}</td>
                  <td>{source.url}</td>
                  <td>{source.mode}</td>
                  <td>{source.lastCrawledAt ?? "-"}</td>
                  <td>
                    <span className={`badge ${source.health === "ok" ? "rss" : source.health === "degraded" ? "scrape" : "pdf_link"}`}>
                      {source.health}
                    </span>
                  </td>
                  <td>{source.enabled ? "有効" : "無効"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
