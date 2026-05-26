import Link from "next/link";
import { BookOpenText, Pencil, Plus, Trash2 } from "lucide-react";
import { NavRail } from "@/components/NavRail";
import { getTermEntries } from "@/lib/data";
import { tagVocabulary } from "@/lib/sample-data";

export const metadata = {
  title: "単語帳管理"
};

export default function AdminWordsPage() {
  const words = getTermEntries();

  return (
    <div className="app-shell">
      <NavRail currentPath="/admin" />
      <main className="main-pane admin-layout">
        <div className="page-heading">
          <div>
            <h1>単語帳管理</h1>
            <p className="muted">AI が登録した単語の追加、編集、削除を管理します。</p>
          </div>
          <button className="button primary" type="button">
            <Plus size={17} /> 単語を追加
          </button>
        </div>

        <section className="admin-panel form-grid">
          <div className="panel-title">
            <span>新規単語</span>
            <BookOpenText size={18} aria-hidden />
          </div>
          <div className="admin-stat-grid">
            <label className="field admin-stat">
              <span>単語</span>
              <input placeholder="例: MLOps" />
            </label>
            <label className="field admin-stat">
              <span>読み</span>
              <input placeholder="例: エムエルオプス" />
            </label>
          </div>
          <label className="field">
            <span>意味</span>
            <textarea rows={3} placeholder="記事の文脈に依存しない、独立した意味を入力" />
          </label>
          <label className="field">
            <span>タグ</span>
            <select multiple size={8} defaultValue={["AI / 機械学習"]} aria-describedby="word-tag-help">
              {tagVocabulary.map((tag) => (
                <option value={tag} key={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <small id="word-tag-help" className="muted">
              固定タグ辞書から最大3件まで選択
            </small>
          </label>
        </section>

        <section className="admin-panel">
          <table className="table">
            <thead>
              <tr>
                <th>単語</th>
                <th>読み</th>
                <th>タグ</th>
                <th>紐づく記事</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {words.map((word) => (
                <tr key={word.word}>
                  <td>
                    <strong>{word.word}</strong>
                    <div className="muted">{word.meaning}</div>
                  </td>
                  <td>{word.reading ?? "-"}</td>
                  <td>{word.tags.join(", ")}</td>
                  <td>{word.count}件</td>
                  <td>
                    <div className="inline-list">
                      <button className="icon-button" type="button" title="編集" aria-label={`${word.word}を編集`}>
                        <Pencil size={16} />
                      </button>
                      <button className="icon-button" type="button" title="削除" aria-label={`${word.word}を削除`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="segment-row">
            <Link className="button" href="/terms">
              公開ページを確認
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
