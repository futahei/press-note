import { CalendarDays, Search } from "lucide-react";

export function TopBar({ defaultQuery = "" }: { defaultQuery?: string }) {
  return (
    <header className="top-bar">
      <form className="search-box" action="/">
        <Search size={18} aria-hidden />
        <input name="q" defaultValue={defaultQuery} placeholder="記事タイトル・企業名・タグで検索" aria-label="記事タイトル・企業名・タグで検索" />
      </form>
      <div className="inline-list">
        <span className="select-like">
          <CalendarDays size={16} aria-hidden /> 2026/05/26
        </span>
      </div>
    </header>
  );
}
