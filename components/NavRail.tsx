"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpenText, Building2, CircleHelp, Home, Menu, Settings, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "ホーム", icon: Home, activeMatch: /^\/$/ },
  { href: "/companies", label: "企業一覧", icon: Building2, activeMatch: /^\/companies/ },
  { href: "/terms", label: "単語帳", icon: BookOpenText, activeMatch: /^\/terms/ },
  { href: "/settings", label: "通知設定", icon: Settings, activeMatch: /^\/settings/ },
  { href: "/about-bot", label: "ヘルプ", icon: CircleHelp, activeMatch: /^\/about-bot/ }
];

const adminItem = { href: "/admin", label: "管理画面", icon: ShieldCheck, activeMatch: /^\/admin/ };

export function NavRail({ currentPath = "/" }: { currentPath?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const primaryNav = (
    <nav className="nav-section">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.activeMatch.test(currentPath);
        return (
          <Link
            key={item.href}
            className={active ? "nav-item active" : "nav-item"}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={21} strokeWidth={2.2} />
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const AdminIcon = adminItem.icon;
  const adminActive = adminItem.activeMatch.test(currentPath);

  return (
    <>
      <div className="mobile-nav-bar">
        <Link className="brand-mark" href="/" aria-label="PressNote ホーム">
          <Image src="/icon.png" width={44} height={44} alt="" priority />
        </Link>
        <button
          className="icon-button"
          type="button"
          aria-label={mobileOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {mobileOpen ? <button className="mobile-nav-backdrop" type="button" aria-label="メニューを閉じる" onClick={() => setMobileOpen(false)} /> : null}

      <aside className={mobileOpen ? "nav-rail mobile-open" : "nav-rail"} aria-label="メインナビゲーション">
        <Link className="brand-mark desktop-brand" href="/" aria-label="PressNote ホーム">
          <Image src="/icon.png" width={44} height={44} alt="" priority />
        </Link>
        {primaryNav}
        <div className="nav-admin">
          <Link
            className={adminActive ? "nav-item active" : "nav-item"}
            href={adminItem.href}
            title={adminItem.label}
            aria-label={adminItem.label}
            onClick={() => setMobileOpen(false)}
          >
            <AdminIcon size={21} strokeWidth={2.2} />
            <span className="mobile-nav-label">{adminItem.label}</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
