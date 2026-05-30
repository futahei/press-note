import { listSources } from "@/lib/data";
import { SourcesManager } from "@/components/admin/SourcesManager";

export default async function AdminSourcesPage() {
  const sources = await listSources();

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div>
        <h1 className="section-title">ソース管理</h1>
        <p className="muted">企業のプレスリリース一覧 URL を登録します。</p>
      </div>
      <SourcesManager sources={sources} />
    </div>
  );
}
