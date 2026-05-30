import { listSources } from "@/lib/data";

export default async function AdminSourcesPage() {
  const sources = await listSources();

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div>
        <h1 className="section-title">ソース管理</h1>
        <p className="muted">企業のプレスリリース一覧 URL を登録します。</p>
      </div>
      <form className="utility-card" action="/api/admin/sources" method="post">
        <div className="form-grid">
          <label>
            <span className="small">企業名</span>
            <input className="input" name="name" required />
          </label>
          <label>
            <span className="small">URL</span>
            <input className="input" name="url" type="url" required />
          </label>
          <label>
            <span className="small">初回取り込み</span>
            <select className="select" name="initialImportCount" defaultValue="0">
              <option value="0">0 件</option>
              <option value="5">5 件</option>
              <option value="10">10 件</option>
              <option value="20">20 件</option>
            </select>
          </label>
          <button className="button-primary" type="submit">
            登録
          </button>
        </div>
      </form>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>企業名</th>
              <th>URL</th>
              <th>最終クロール</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id}>
                <td>{source.name}</td>
                <td>
                  <a className="text-link" href={source.url} target="_blank" rel="noopener">
                    {source.url}
                  </a>
                </td>
                <td>{source.last_crawled_at ? new Date(source.last_crawled_at).toLocaleString("ja-JP") : "未実行"}</td>
                <td>{source.enabled ? "有効" : "無効"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
