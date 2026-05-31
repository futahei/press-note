import Link from "next/link";
import { getAdminSummary, listUsageDaily } from "@/lib/data";

export default async function AdminPage() {
  const [summary, usage] = await Promise.all([getAdminSummary(), listUsageDaily()]);
  const totalCost = usage.reduce((sum, row) => sum + Number(row.cost_usd), 0);
  const last30Days = usage.slice(-30);
  const maxCost = Math.max(...last30Days.map((row) => Number(row.cost_usd)), 0.01);
  const modelTotals = last30Days.reduce<Record<string, number>>((acc, row) => {
    acc[row.model] = (acc[row.model] ?? 0) + Number(row.cost_usd);
    return acc;
  }, {});

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div>
        <h1 className="section-title">ダッシュボード</h1>
        <p className="muted">監視状態と LLM 利用量を確認します。</p>
      </div>
      <div className="stat-grid">
        <div className="stat">
          <span className="small">監視中ソース</span>
          <strong>{summary.sourceCount}</strong>
        </div>
        <div className="stat">
          <span className="small">今日の記事</span>
          <strong>{summary.todayArticleCount}</strong>
        </div>
        <div className="stat">
          <span className="small">未対応報告</span>
          <strong>{summary.openReportCount}</strong>
        </div>
        <div className="stat">
          <span className="small">不具合報告</span>
          <strong>{summary.openBugReportCount}</strong>
        </div>
        <div className="stat">
          <span className="small">用語</span>
          <strong>{summary.termCount}</strong>
        </div>
      </div>
      <section className="utility-card">
        <div>
          <h2 className="section-title">LLM コスト</h2>
          <p className="muted">直近データ合計 ${totalCost.toFixed(4)}</p>
        </div>
        <div className="bar-chart" aria-label="直近 30 日の日次 OpenAI 使用料">
          {last30Days.map((row) => (
            <div className="bar-chart-item" key={`${row.usage_date}-${row.model}`}>
              <div className="bar-track">
                <span
                  className="bar-fill"
                  style={{ height: `${Math.max(8, (Number(row.cost_usd) / maxCost) * 100)}%` }}
                />
              </div>
              <span className="small">{new Date(row.usage_date).getDate()}</span>
            </div>
          ))}
        </div>
        <div className="chips" aria-label="モデル別内訳">
          {Object.entries(modelTotals).map(([model, cost]) => (
            <span className="chip" key={model}>
              {model}: ${cost.toFixed(4)}
            </span>
          ))}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>日付</th>
                <th>モデル</th>
                <th>入力</th>
                <th>出力</th>
                <th>USD</th>
              </tr>
            </thead>
            <tbody>
              {usage.slice(-30).map((row) => (
                <tr key={`${row.usage_date}-${row.model}`}>
                  <td>{row.usage_date}</td>
                  <td>{row.model}</td>
                  <td>{row.input_tokens.toLocaleString()}</td>
                  <td>{row.output_tokens.toLocaleString()}</td>
                  <td>${Number(row.cost_usd).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="button-row">
        <Link className="button-primary" href="/admin/sources">
          ソース管理
        </Link>
        <Link className="button-secondary" href="/admin/words">
          用語管理
        </Link>
        <Link className="button-secondary" href="/admin/reports">
          報告管理
        </Link>
        <Link className="button-secondary" href="/admin/bug-reports">
          不具合報告
        </Link>
      </div>
    </div>
  );
}
