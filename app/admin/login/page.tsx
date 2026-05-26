import Image from "next/image";
import { LockKeyhole } from "lucide-react";

export const metadata = {
  title: "管理者ログイン"
};

type LoginPageProps = {
  searchParams?: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <main className="main-pane admin-layout">
      <div className="page-heading">
        <div>
          <Image src="/icon.png" width={52} height={52} alt="" />
          <h1>管理者ログイン</h1>
          <p className="muted">監視ソースとジョブ状態を管理します。</p>
        </div>
      </div>
      <form className="admin-panel form-grid" method="post" action="/api/admin/login">
        <input type="hidden" name="next" value={params.next ?? "/admin"} />
        <label className="field">
          <span>管理者パスワード</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="button primary" type="submit">
          <LockKeyhole size={17} /> ログイン
        </button>
      </form>
    </main>
  );
}

