import { getAdminSummary } from "@/lib/data";
import { listOpenAICostsForCurrentMonth } from "@/lib/openai-costs";

const DEFAULT_USD_TO_JPY_RATE = 160;
const JAPAN_TIME_ZONE = "Asia/Tokyo";

function getUsdToJpyRate() {
  const rate = Number(process.env.USD_TO_JPY_RATE ?? DEFAULT_USD_TO_JPY_RATE);
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_USD_TO_JPY_RATE;
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getCurrentMonthDateKeys(now = new Date()) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: JAPAN_TIME_ZONE,
    year: "numeric",
    month: "numeric"
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value) - 1;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: lastDay }, (_, index) => toDateKey(year, month, index + 1));
}

export default async function AdminPage() {
  const [summary, openAiCosts] = await Promise.all([getAdminSummary(), listOpenAICostsForCurrentMonth()]);
  const usdToJpyRate = getUsdToJpyRate();
  const currentMonthDateKeys = getCurrentMonthDateKeys();
  const monthlyCostByDate = openAiCosts.costs.reduce<Record<string, { costUsd: number }>>((acc, row) => {
    acc[row.usage_date] ??= { costUsd: 0 };
    acc[row.usage_date].costUsd += Number(row.cost_usd);
    return acc;
  }, {});
  const chartRows = currentMonthDateKeys.map((dateKey) => {
    const costForDate = monthlyCostByDate[dateKey] ?? { costUsd: 0 };
    return {
      ...costForDate,
      dateKey,
      day: Number(dateKey.slice(-2)),
      costYen: Math.round(costForDate.costUsd * usdToJpyRate)
    };
  });
  const maxCostYen = Math.max(...chartRows.map((row) => row.costYen), 1);
  const monthlyCostUsd = chartRows.reduce((sum, row) => sum + row.costUsd, 0);
  const monthlyCostYen = Math.round(monthlyCostUsd * usdToJpyRate);
  const lineItemTotals = openAiCosts.lineItemTotals;
  const visibleTableRows = chartRows.filter((row) => row.costUsd > 0);

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
          <span className="small">未対応記事報告</span>
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
          <p className="muted">
            当月合計 約 {monthlyCostYen.toLocaleString("ja-JP")} 円（OpenAI Costs API / 1 USD ={" "}
            {usdToJpyRate.toLocaleString("ja-JP")} 円換算）
          </p>
          {!openAiCosts.available ? (
            <p className="notice" role="status">
              OpenAI のコスト取得には `OPENAI_ADMIN_API_KEY` の設定が必要です。
            </p>
          ) : null}
          {openAiCosts.error ? (
            <p className="notice" role="alert">
              OpenAI コストを取得できませんでした: {openAiCosts.error}
            </p>
          ) : null}
        </div>
        <div className="cost-chart">
          <div className="cost-axis" aria-hidden="true">
            <span>{maxCostYen.toLocaleString("ja-JP")} 円</span>
            <span>0 円</span>
          </div>
          <div className="bar-chart" aria-label="当月1日から末日までの日次OpenAI使用料（円）">
            {chartRows.map((row) => (
              <div className="bar-chart-item" key={row.dateKey}>
                <div className="bar-track" title={`${row.day}日 ${row.costYen.toLocaleString("ja-JP")}円`}>
                  <span
                    className="bar-fill"
                    style={{
                      height:
                        row.costYen > 0 ? `${Math.max(6, (row.costYen / maxCostYen) * 100)}%` : "0%"
                    }}
                  />
                </div>
                <span className="small">{row.day}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="chips" aria-label="費目別内訳">
          {Object.entries(lineItemTotals).map(([lineItem, cost]) => (
            <span className="chip" key={lineItem}>
              {lineItem}: 約 {Math.round(cost * usdToJpyRate).toLocaleString("ja-JP")} 円
            </span>
          ))}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>日付</th>
                <th>コスト（円）</th>
                <th>USD</th>
              </tr>
            </thead>
            <tbody>
              {visibleTableRows.length > 0 ? (
                visibleTableRows.map((row) => (
                  <tr key={row.dateKey}>
                    <td>{row.dateKey}</td>
                    <td>{row.costYen.toLocaleString("ja-JP")} 円</td>
                    <td>${row.costUsd.toFixed(4)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>当月のコストデータはまだありません。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
