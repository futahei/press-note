import { NavRail } from "@/components/NavRail";

export const metadata = {
  title: "PressNoteBot について"
};

export default function AboutBotPage() {
  return (
    <div className="app-shell">
      <NavRail currentPath="/about-bot" />
      <main className="main-pane">
        <div className="page-heading">
          <div>
            <h1>PressNoteBot について</h1>
            <p className="muted">公開情報の収集方針と連絡先。</p>
          </div>
        </div>
        <section className="detail-section">
          <h2 className="section-title">収集方針</h2>
          <p>
            PressNoteBot は公開されたプレスリリース、IR、RSS/Atom フィード、PDF リンクのみを対象に収集します。
            ログインや CAPTCHA が必要なページは対象外とし、robots.txt と Crawl-delay を尊重します。
          </p>
        </section>
        <section className="detail-section">
          <h2 className="section-title">User-Agent</h2>
          <p>
            <code>PressNoteBot/0.1 (+https://example.com/about-bot)</code>
          </p>
        </section>
        <section className="detail-section">
          <h2 className="section-title">連絡先</h2>
          <p>収集停止や掲載内容に関する問い合わせは、運用者が設定する連絡先へ送ってください。</p>
        </section>
      </main>
    </div>
  );
}

