import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PressNote",
    template: "%s | PressNote"
  },
  description: "企業プレスリリースの要約と用語解説を毎日確認できるアーカイブ"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <header className="global-nav">
          <div className="global-nav-inner">
            <Link href="/" aria-label="PressNote ホーム">
              PressNote
            </Link>
            <nav className="nav-links" aria-label="グローバル">
              <Link href="/articles">記事</Link>
              <Link href="/terms">用語帳</Link>
              <Link href="/settings">通知設定</Link>
              <Link href="/admin">管理</Link>
            </nav>
          </div>
        </header>
        <div className="sub-nav">
          <div className="sub-nav-inner">
            <Link className="brand" href="/">
              PressNote
            </Link>
            <nav className="sub-links" aria-label="セクション">
              <Link className="optional" href="/articles">
                過去記事
              </Link>
              <Link className="optional" href="/terms">
                用語帳
              </Link>
              <Link className="button-primary" href="/settings">
                通知
              </Link>
            </nav>
          </div>
        </div>
        {children}
        <footer className="footer">
          <div className="container">
            <p>PressNote は登録した企業のプレスリリースを収集し、要約と用語解説を保存します。</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
