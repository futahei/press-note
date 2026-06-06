import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { BugReportButton } from "@/components/BugReportButton";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { ArchiveIcon, BellIcon, BookIcon, HomeIcon, ShieldIcon } from "@/components/Icons";
import { getGoogleAnalyticsMeasurementId } from "@/lib/analytics";
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
  const gaMeasurementId = getGoogleAnalyticsMeasurementId();

  return (
    <html lang="ja">
      <body>
        <a className="skip-link" href="#main-content">
          本文へ移動
        </a>
        <header className="global-nav">
          <div className="global-nav-inner">
            <Link className="brand-link" href="/" aria-label="PressNote ホーム">
              <Image alt="" className="brand-icon" height={28} priority src="/icon.png" width={28} />
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
          <div className="container footer-grid">
            <div className="footer-brand">
              <Link className="brand-link" href="/" aria-label="PressNote ホーム">
                <Image alt="" className="brand-icon" height={28} src="/icon.png" width={28} />
                <span className="brand-wordmark">PressNote</span>
              </Link>
              <p>各社公式のプレスリリースを収集し、AI要約で一覧できる個人運用のニュースノートです。</p>
            </div>
            <nav className="footer-nav" aria-label="サイトメニュー">
              <h2>サイトメニュー</h2>
              <Link href="/">最新</Link>
              <Link href="/articles">記事一覧</Link>
              <Link href="/terms">用語帳</Link>
              <Link href="/settings">通知設定</Link>
            </nav>
            <nav className="footer-nav" aria-label="運用">
              <h2>運用</h2>
              <a href="https://github.com/futahei/press-note" rel="noreferrer" target="_blank">
                GitHub
              </a>
              <a href="https://github.com/futahei/press-note/blob/main/README.md" rel="noreferrer" target="_blank">
                README
              </a>
              <a href="https://github.com/futahei/press-note/blob/main/docs/SPEC.md" rel="noreferrer" target="_blank">
                仕様書
              </a>
            </nav>
            <div className="footer-note">
              <h2>注意</h2>
              <p>要約はAI生成です。正確な内容はリンク先の原文を確認してください。</p>
              <p>不具合報告と機能要望は画面右下のフィードバックボタンから匿名で送信できます。</p>
            </div>
          </div>
        </footer>
        <BugReportButton />
        <Suspense fallback={null}>
          <GoogleAnalytics measurementId={gaMeasurementId} />
        </Suspense>
      </body>
    </html>
  );
}
