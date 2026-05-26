import { Clock, Save } from "lucide-react";
import { NavRail } from "@/components/NavRail";

export const metadata = {
  title: "通知設定"
};

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hour = String(Math.floor(index / 2)).padStart(2, "0");
  const minute = index % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

export default function SettingsPage() {
  return (
    <div className="app-shell">
      <NavRail currentPath="/settings" />
      <main className="main-pane admin-layout">
        <div className="page-heading">
          <div>
            <h1>通知設定</h1>
            <p className="muted">ブラウザ通知を受け取る時刻を30分単位で設定します。</p>
          </div>
        </div>

        <section className="admin-panel form-grid">
          <div className="panel-title">
            <span>通知時刻</span>
            <Clock size={18} aria-hidden />
          </div>
          <label className="field">
            <span>受信時刻</span>
            <select defaultValue="09:00">
              {timeOptions.map((time) => (
                <option value={time} key={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
          <p className="muted">タイムゾーンはブラウザから自動取得します。新着記事がない日は通知しません。</p>
          <div className="segment-row">
            <button className="button primary" type="button">
              <Save size={17} /> 保存
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

