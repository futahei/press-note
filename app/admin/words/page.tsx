import { listTerms } from "@/lib/data";
import { WordsManager } from "@/components/admin/WordsManager";
import { SubmitButton } from "@/components/SubmitButton";

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
          <SubmitButton className="button-primary" pendingLabel="追加中">
            追加
          </SubmitButton>
        </div>
      </form>
      <WordsManager terms={terms} />
    </div>
  );
}
