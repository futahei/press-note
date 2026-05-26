import Image from "next/image";
import Link from "next/link";
import { Bell, Building2, CircleHelp, Home, LineChart, Settings, Tags } from "lucide-react";

const navItems = [
  { href: "/", label: "ホーム", icon: Home, activeMatch: /^\/$/ },
  { href: "/companies", label: "企業一覧", icon: Building2, activeMatch: /^\/companies/ },
  { href: "/admin", label: "管理", icon: Settings, activeMatch: /^\/admin/ },
  { href: "/about-bot", label: "ヘルプ", icon: CircleHelp, activeMatch: /^\/about-bot/ }
];

const placeholderItems = [
  { label: "アラート", icon: Bell },
  { label: "トピック", icon: Tags },
  { label: "分析", icon: LineChart }
];

export function NavRail({ currentPath = "/" }: { currentPath?: string }) {
  return (
    <aside className="nav-rail" aria-label="メインナビゲーション">
      <Link className="brand-mark" href="/" aria-label="PressNote ホーム">
        <Image src="/icon.png" width={44} height={44} alt="" priority />
      </Link>
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
            >
              <Icon size={21} strokeWidth={2.2} />
            </Link>
          );
        })}
      </nav>
      <div className="nav-section" aria-label="準備中の機能">
        {placeholderItems.map((item) => {
          const Icon = item.icon;
          return (
            <span key={item.label} className="nav-item" title={`${item.label}（準備中）`} aria-label={`${item.label}（準備中）`}>
              <Icon size={20} strokeWidth={2} />
            </span>
          );
        })}
      </div>
    </aside>
  );
}

