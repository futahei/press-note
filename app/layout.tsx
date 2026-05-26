import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PressNote",
    template: "%s | PressNote"
  },
  description: "監視対象企業のプレスリリースを毎日収集し、AI 要約と単語帳で配信する Web アプリ。",
  icons: {
    icon: "/icon.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
