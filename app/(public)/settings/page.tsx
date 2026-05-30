import { SettingsClient } from "@/components/SettingsClient";

export default function SettingsPage() {
  return (
    <main className="page">
      <section className="tile tile-light">
        <div className="container" style={{ display: "grid", gap: 24 }}>
          <div>
            <h1 className="section-title">通知設定</h1>
            <p className="muted">毎朝 8 時の新着プレス通知を管理します。</p>
          </div>
          <SettingsClient />
        </div>
      </section>
    </main>
  );
}
