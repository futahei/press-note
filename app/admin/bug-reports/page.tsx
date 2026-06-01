import Link from "next/link";
import { BugReportResolveButton } from "@/components/admin/BugReportResolveButton";
import { listOpenBugReports } from "@/lib/data";
import type { BugReport } from "@/lib/types";

type FeedbackFilter = "all" | "bug" | "feature";

const filterItems: Array<{ href: string; label: string; value: FeedbackFilter }> = [
  { href: "/admin/bug-reports", label: "すべて", value: "all" },
  { href: "/admin/bug-reports?kind=bug", label: "不具合報告", value: "bug" },
  { href: "/admin/bug-reports?kind=feature", label: "機能要望", value: "feature" }
];

function feedbackKind(report: BugReport) {
  return report.kind === "feature" ? "feature" : "bug";
}

function feedbackKindLabel(report: BugReport) {
  return feedbackKind(report) === "feature" ? "機能要望" : "不具合報告";
}

export default async function AdminBugReportsPage({
  searchParams
}: {
  searchParams?: Promise<{ kind?: string }>;
}) {
  const params = await searchParams;
  const activeKind: FeedbackFilter = params?.kind === "bug" || params?.kind === "feature" ? params.kind : "all";
  const reports = await listOpenBugReports(activeKind);

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div>
        <h1 className="section-title">フィードバック</h1>
        <p className="muted">匿名で届いた不具合報告と機能要望を確認します。</p>
      </div>
      <div className="feedback-filter-row" aria-label="フィードバック種別フィルター">
        {filterItems.map((item) => (
          <Link key={item.value} className={activeKind === item.value ? "active" : ""} href={item.href}>
            {item.label}
          </Link>
        ))}
      </div>
      <div className="admin-list">
        {reports.map((report) => (
          <article key={report.id} className={`utility-card feedback-card ${feedbackKind(report)}`}>
            <div className="feedback-card-head">
              <span className={`feedback-kind-badge ${feedbackKind(report)}`}>{feedbackKindLabel(report)}</span>
              <span className="small">{new Date(report.created_at).toLocaleString("ja-JP")}</span>
            </div>
            <h2 className="card-title">{report.message}</h2>
            <dl className="bug-report-meta">
              <div>
                <dt>パス</dt>
                <dd>{report.path}</dd>
              </div>
              {feedbackKind(report) === "bug" ? (
                <>
                  <div>
                    <dt>表示</dt>
                    <dd>{report.viewport || "未取得"}</dd>
                  </div>
                  <div>
                    <dt>言語</dt>
                    <dd>{report.language || "未取得"}</dd>
                  </div>
                  <div>
                    <dt>タイムゾーン</dt>
                    <dd>{report.timezone || "未取得"}</dd>
                  </div>
                  <div>
                    <dt>User-Agent</dt>
                    <dd>{report.user_agent || "未取得"}</dd>
                  </div>
                </>
              ) : null}
            </dl>
            {feedbackKind(report) === "bug" ? (
              <details>
                <summary>ログ {report.logs.length} 件</summary>
                {report.logs.length > 0 ? (
                  <ul className="bug-log-list">
                    {report.logs.map((log, index) => (
                      <li key={`${log.occurred_at}-${index}`}>
                        <span className="small">
                          {log.occurred_at ? new Date(log.occurred_at).toLocaleString("ja-JP") : "日時不明"} / {log.level}
                        </span>
                        <code>{log.message}</code>
                        {log.source ? <span className="small">{log.source}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">ログはありません。</p>
                )}
              </details>
            ) : (
              <p className="muted">機能要望のため、コンソールログは送信されていません。</p>
            )}
            <BugReportResolveButton reportId={report.id} />
          </article>
        ))}
      </div>
      {reports.length === 0 ? <p className="muted">未対応のフィードバックはありません。</p> : null}
    </div>
  );
}
