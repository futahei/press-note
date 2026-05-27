import { NavRail } from "@/components/NavRail";
import { SourceWizardClient } from "@/components/SourceWizardClient";

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
            <p className="muted">管理者が確認済みの企業ページを解析し、取得方式と初回バックフィルを設定します。</p>
          </div>
        </div>
        <SourceWizardClient />
      </main>
    </div>
  );
}
