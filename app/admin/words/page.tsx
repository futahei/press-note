import { listTerms } from "@/lib/data";

export default async function AdminWordsPage() {
  const terms = await listTerms();

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div>
        <h1 className="section-title">用語管理</h1>
        <p className="muted">AI 抽出語と管理者追加語を編集します。</p>
      </div>
      <form className="utility-card" action="/api/admin/words" method="post">
        <div className="form-grid">
          <label>
            <span className="small">見出し語</span>
            <input className="input" name="headword" required />
          </label>
          <label>
            <span className="small">読み方</span>
            <input className="input" name="reading" required />
          </label>
          <label style={{ gridColumn: "span 2" }}>
            <span className="small">解説</span>
            <input className="input" name="description" required />
          </label>
          <button className="button-primary" type="submit">
            追加
          </button>
        </div>
      </form>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>見出し語</th>
              <th>読み方</th>
              <th>登録元</th>
              <th>関連記事</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((term) => (
              <tr key={term.id}>
                <td>{term.headword}</td>
                <td>{term.reading}</td>
                <td>{term.source_kind === "ai" ? "AI 自動" : "管理者手動"}</td>
                <td>{term.article_count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
