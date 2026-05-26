import { Bell, Bookmark, CalendarDays, Search } from "lucide-react";

export function TopBar({ defaultQuery = "" }: { defaultQuery?: string }) {
  return (
    <header className="top-bar">
      <form className="search-box" action="/">
        <Search size={18} aria-hidden />
        <input name="q" defaultValue={defaultQuery} placeholder="企業名・キーワードで検索" aria-label="企業名・キーワードで検索" />
      </form>
      <div className="inline-list">
        <span className="select-like">
          <CalendarDays size={16} aria-hidden /> 2026/05/26
        </span>
        <button className="icon-button" type="button" title="通知設定" aria-label="通知設定">
          <Bell size={19} />
        </button>
        <button className="icon-button" type="button" title="保存済み" aria-label="保存済み">
          <Bookmark size={19} />
        </button>
      </div>
    </header>
  );
}

