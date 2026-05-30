import { listOpenReports } from "@/lib/data";

export default async function AdminReportsPage() {
  const reports = await listOpenReports();

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div>
        <h1 className="section-title">報告管理</h1>
        <p className="muted">ユーザーからの「プレスではない」報告に対応します。</p>
      </div>
      <div className="grid">
        {reports.map((report) => (
          <article key={report.id} className="utility-card">
            <div className="small">{new Date(report.created_at).toLocaleString("ja-JP")}</div>
            <h3>{report.article?.title ?? "削除済み記事"}</h3>
            <p>{report.article?.summary}</p>
            <div className="button-row">
              <form action={`/api/admin/reports/${report.id}/accept`} method="post">
                <button className="button-rect" type="submit">
                  記事を削除
                </button>
              </form>
              <form action={`/api/admin/reports/${report.id}/reject`} method="post">
                <button className="button-secondary" type="submit">
                  報告を却下
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
      {reports.length === 0 ? <p className="muted">未対応の報告はありません。</p> : null}
    </div>
  );
}
