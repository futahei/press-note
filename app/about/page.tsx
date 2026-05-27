import { NavRail } from "@/components/NavRail";

export const metadata = {
  title: "PressNoteについて"
};

export default function AboutPage() {
  return (
    <div className="app-shell">
      <NavRail currentPath="/about" />
      <main className="main-pane">
        <div className="page-heading">
          <div>
            <h1>PressNoteについて</h1>
            <p className="muted">企業の発表を追いやすくするためのプレスリリース閲覧サービスです。</p>
          </div>
        </div>

        <section className="detail-section">
          <h2 className="section-title">できること</h2>
          <p>
            PressNoteは、登録された監視ソースから公開情報を取得し、AIによる要約、タグ付け、単語解説とともに表示します。
            気になる企業の発表を一覧で確認し、詳細ページで内容をすばやく把握できます。
          </p>
        </section>

        <section className="detail-section">
          <h2 className="section-title">単語帳</h2>
          <p>
            記事解析時に抽出された専門用語や略語は単語帳に登録されます。単語、読み、文脈に依存しない意味、タグ、関連する最新記事を確認できます。
          </p>
        </section>

        <section className="detail-section">
          <h2 className="section-title">通知</h2>
          <p>ブラウザ通知を有効にすると、設定した通知時刻に新しい記事を確認できます。通知時刻は設定画面から変更できます。</p>
        </section>

        <section className="detail-section">
          <h2 className="section-title">収集方針</h2>
          <p>
            収集対象は公開されたプレスリリース、IR、RSS/Atomフィード、PDFリンクです。ログインやCAPTCHAが必要なページは対象外とし、robots.txtとCrawl-delayを尊重します。
          </p>
        </section>
      </main>
    </div>
  );
}
