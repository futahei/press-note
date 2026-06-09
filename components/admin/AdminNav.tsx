import Link from "next/link";

const items = [
  { href: "/admin", label: "概要" },
  { href: "/admin/sources", label: "ソース" },
  { href: "/admin/articles", label: "記事" },
  { href: "/admin/words", label: "用語" },
  { href: "/admin/reports", label: "記事報告" },
  { href: "/admin/bug-reports", label: "フィードバック" }
];

export function AdminNav() {
  return (
    <aside className="admin-sidebar">
      <h2 className="brand">管理</h2>
      <nav aria-label="管理メニュー">
        {items.map((item) => (
          <Link key={item.href} className="button-secondary" href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
