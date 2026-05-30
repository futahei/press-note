import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveIcon, BellIcon, BookIcon, HomeIcon, ShieldIcon } from "@/components/Icons";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PressNote",
    template: "%s | PressNote"
  },
  description: "企業プレスリリースの要約と用語解説を毎日確認できるアーカイブ",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <a className="skip-link" href="#main-content">
          本文へ移動
        </a>
        <header className="global-nav">
          <div className="global-nav-inner">
            <Link className="brand-link" href="/" aria-label="PressNote ホーム">
              <img alt="" className="brand-icon" height="28" src="/icon.png" width="28" />
              <span className="brand-wordmark">PressNote</span>
            </Link>
            <nav className="nav-links" aria-label="主要ナビゲーション">
              <Link className="nav-icon-link" href="/" aria-label="ホーム" title="ホーム">
                <HomeIcon />
              </Link>
              <Link className="nav-icon-link" href="/articles" aria-label="過去記事" title="過去記事">
                <ArchiveIcon />
              </Link>
              <Link className="nav-icon-link" href="/terms" aria-label="用語帳" title="用語帳">
                <BookIcon />
              </Link>
              <Link className="nav-icon-link" href="/settings" aria-label="通知設定" title="通知設定">
                <BellIcon />
              </Link>
              <Link className="nav-icon-link" href="/admin" aria-label="管理" title="管理">
                <ShieldIcon />
              </Link>
            </nav>
          </div>
        </header>
        <div id="main-content">{children}</div>
        <footer className="footer">
          <div className="container">
            <p>PressNote は登録した企業のプレスリリースを収集し、要約と用語解説を保存します。</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
