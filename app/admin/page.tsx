import { getAdminSummary, listUsageDaily } from "@/lib/data";

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
  const [summary, usage] = await Promise.all([getAdminSummary(), listUsageDaily()]);
  const usdToJpyRate = getUsdToJpyRate();
  const currentMonthDateKeys = getCurrentMonthDateKeys();
  const currentMonthKeySet = new Set(currentMonthDateKeys);
  const currentMonthUsage = usage.filter((row) => currentMonthKeySet.has(row.usage_date));
  const monthlyUsageByDate = currentMonthUsage.reduce<
    Record<string, { costUsd: number; inputTokens: number; outputTokens: number }>
  >((acc, row) => {
    acc[row.usage_date] ??= { costUsd: 0, inputTokens: 0, outputTokens: 0 };
    acc[row.usage_date].costUsd += Number(row.cost_usd);
    acc[row.usage_date].inputTokens += row.input_tokens;
    acc[row.usage_date].outputTokens += row.output_tokens;
    return acc;
  }, {});
  const chartRows = currentMonthDateKeys.map((dateKey) => {
    const usageForDate = monthlyUsageByDate[dateKey] ?? { costUsd: 0, inputTokens: 0, outputTokens: 0 };
    return {
      ...usageForDate,
      dateKey,
      day: Number(dateKey.slice(-2)),
      costYen: Math.round(usageForDate.costUsd * usdToJpyRate)
    };
  });
  const maxCostYen = Math.max(...chartRows.map((row) => row.costYen), 1);
  const monthlyCostUsd = currentMonthUsage.reduce((sum, row) => sum + Number(row.cost_usd), 0);
  const monthlyCostYen = Math.round(monthlyCostUsd * usdToJpyRate);
  const modelTotals = currentMonthUsage.reduce<Record<string, number>>((acc, row) => {
    acc[row.model] = (acc[row.model] ?? 0) + Number(row.cost_usd);
    return acc;
  }, {});
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
            当月合計 約 {monthlyCostYen.toLocaleString("ja-JP")} 円（1 USD ={" "}
            {usdToJpyRate.toLocaleString("ja-JP")} 円換算）
          </p>
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
        <div className="chips" aria-label="モデル別内訳">
          {Object.entries(modelTotals).map(([model, cost]) => (
            <span className="chip" key={model}>
              {model}: 約 {Math.round(cost * usdToJpyRate).toLocaleString("ja-JP")} 円
            </span>
          ))}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>日付</th>
                <th>入力</th>
                <th>出力</th>
                <th>コスト（円）</th>
                <th>USD</th>
              </tr>
            </thead>
            <tbody>
              {visibleTableRows.length > 0 ? (
                visibleTableRows.map((row) => (
                  <tr key={row.dateKey}>
                    <td>{row.dateKey}</td>
                    <td>{row.inputTokens.toLocaleString()}</td>
                    <td>{row.outputTokens.toLocaleString()}</td>
                    <td>{row.costYen.toLocaleString("ja-JP")} 円</td>
                    <td>${row.costUsd.toFixed(4)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>当月の利用データはまだありません。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
