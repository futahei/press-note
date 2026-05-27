import { AdminWordsClient } from "@/components/AdminWordsClient";
import { NavRail } from "@/components/NavRail";
import { getTermEntries } from "@/lib/data";

export const metadata = {
  title: "単語帳管理"
};

export const dynamic = "force-dynamic";

export default async function AdminWordsPage() {
  const words = await getTermEntries();

  return (
    <div className="app-shell">
      <NavRail currentPath="/admin" />
      <main className="main-pane admin-layout">
        <AdminWordsClient initialWords={words} />
      </main>
    </div>
  );
}
