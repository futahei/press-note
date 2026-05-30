"use client";

import { useRouter } from "next/navigation";
import type { Term } from "@/lib/types";

export function WordsManager({ terms }: { terms: Term[] }) {
  const router = useRouter();

  async function updateTerm(id: string, payload: Partial<Pick<Term, "headword" | "reading" | "description">>) {
    const response = await fetch(`/api/admin/words/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (response.ok) router.refresh();
  }

  async function deleteTerm(id: string) {
    if (!confirm("この用語を削除しますか。関連記事との紐付けも削除されます。")) return;
    const response = await fetch(`/api/admin/words/${id}`, { method: "DELETE" });
    if (response.ok) router.refresh();
  }

  return (
    <div className="admin-list">
      {terms.map((term) => (
        <article className="utility-card" key={term.id}>
          <div className="form-grid">
            <label>
              <span className="small">見出し語</span>
              <input
                className="input"
                defaultValue={term.headword}
                onBlur={(event) => {
                  if (event.target.value !== term.headword) updateTerm(term.id, { headword: event.target.value });
                }}
              />
            </label>
            <label>
              <span className="small">読み方</span>
              <input
                className="input"
                defaultValue={term.reading}
                onBlur={(event) => {
                  if (event.target.value !== term.reading) updateTerm(term.id, { reading: event.target.value });
                }}
              />
            </label>
            <label style={{ gridColumn: "span 2" }}>
              <span className="small">解説</span>
              <input
                className="input"
                defaultValue={term.description}
                onBlur={(event) => {
                  if (event.target.value !== term.description) updateTerm(term.id, { description: event.target.value });
                }}
              />
            </label>
            <button className="button-rect" type="button" onClick={() => deleteTerm(term.id)}>
              削除
            </button>
          </div>
          <p className="small">
            登録元: {term.source_kind === "ai" ? "AI 自動" : "管理者手動"} / 関連記事: {term.article_count ?? 0} 件
          </p>
        </article>
      ))}
    </div>
  );
}
