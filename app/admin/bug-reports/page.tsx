import { BugReportResolveButton } from "@/components/admin/BugReportResolveButton";
import { listOpenBugReports } from "@/lib/data";

export default async function AdminBugReportsPage() {
  const reports = await listOpenBugReports();

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div>
        <h1 className="section-title">不具合報告</h1>
        <p className="muted">匿名で届いた不具合報告と自動取得された状況を確認します。</p>
      </div>
      <div className="admin-list">
        {reports.map((report) => (
          <article key={report.id} className="utility-card">
            <div className="small">{new Date(report.created_at).toLocaleString("ja-JP")}</div>
            <h2 className="card-title">{report.message}</h2>
            <dl className="bug-report-meta">
              <div>
                <dt>パス</dt>
                <dd>{report.path}</dd>
              </div>
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
            </dl>
            <details>
              <summary>ログ {report.logs.length} 件</summary>
              {report.logs.length > 0 ? (
                <ul className="bug-log-list">
                  {report.logs.map((log, index) => (
                    <li key={`${log.occurred_at}-${index}`}>
                      <span className="small">
                        {log.occurred_at ? new Date(log.occurred_at).toLocaleString("ja-JP") : "日時不明"} /{" "}
                        {log.level}
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
            <BugReportResolveButton reportId={report.id} />
          </article>
        ))}
      </div>
      {reports.length === 0 ? <p className="muted">未対応の不具合報告はありません。</p> : null}
    </div>
  );
}
