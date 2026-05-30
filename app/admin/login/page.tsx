import { SubmitButton } from "@/components/SubmitButton";

export default function AdminLoginPage() {
  return (
    <main className="page">
      <section className="tile tile-light">
        <form className="utility-card" action="/api/admin/login" method="post" style={{ maxWidth: 440, margin: "0 auto" }}>
          <div>
            <h1 className="section-title">管理ログイン</h1>
            <p className="muted">管理者パスワードを入力してください。</p>
          </div>
          <label>
            <span className="small">パスワード</span>
            <input className="input" name="password" type="password" autoComplete="current-password" required />
          </label>
          <SubmitButton className="button-primary" pendingLabel="ログイン中">
            ログイン
          </SubmitButton>
        </form>
      </section>
    </main>
  );
}
