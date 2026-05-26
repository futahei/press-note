import { AdminWordsClient } from "@/components/AdminWordsClient";
import { NavRail } from "@/components/NavRail";
import { getTermEntries } from "@/lib/data";

export const metadata = {
  title: "単語帳管理"
};

export default function AdminWordsPage() {
  const words = getTermEntries();

  return (
    <div className="app-shell">
      <NavRail currentPath="/admin" />
      <main className="main-pane admin-layout">
        <AdminWordsClient initialWords={words} />
      </main>
    </div>
  );
}
