import { WandSparkles } from "lucide-react";
import { NavRail } from "@/components/NavRail";

export const metadata = {
  title: "ソース登録"
};

export default function NewSourcePage() {
  return (
    <div className="app-shell">
      <NavRail currentPath="/admin" />
      <main className="main-pane admin-layout">
        <div className="page-heading">
          <div>
            <h1>ソース登録ウィザード</h1>
            <p className="muted">URL を入力し、AI 解析で抽出方式の候補を作成します。</p>
          </div>
        </div>
        <section className="admin-panel form-grid">
          <label className="field">
            <span>監視対象 URL</span>
            <input placeholder="https://example.com/news" type="url" />
          </label>
          <div className="admin-stat-grid">
            <label className="field admin-stat">
              <span>企業名</span>
              <input placeholder="株式会社サンプル" />
            </label>
            <label className="field admin-stat">
              <span>初期バックフィル</span>
              <select defaultValue="0">
                <option value="0">0件</option>
                <option value="5">5件</option>
                <option value="10">10件</option>
                <option value="20">20件</option>
              </select>
            </label>
          </div>
          <button className="button primary" type="button">
            <WandSparkles size={17} /> AI 解析を実行
          </button>
        </section>
      </main>
    </div>
  );
}

