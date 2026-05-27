import Image from "next/image";
import { EmptyState } from "@/components/EmptyState";
import { NavRail } from "@/components/NavRail";
import { WidgetPanel } from "@/components/WidgetPanel";
import { getCompanies } from "@/lib/data";

export const metadata = {
  title: "企業一覧"
};

export const revalidate = 60;

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="app-shell">
      <NavRail currentPath="/companies" />
      <main className="main-pane">
        <div className="page-heading">
          <div>
            <h1>企業一覧</h1>
            <p className="muted">登録済みソースの企業を確認できます。</p>
          </div>
        </div>
        {companies.length > 0 ? (
          <section className="article-list">
            {companies.map((company) => (
              <article className="press-card" key={company.id}>
                <div className="logo-box">
                  <Image src={company.logoUrl} width={58} height={58} alt="" />
                </div>
                <div>
                  <h2>{company.name}</h2>
                  {company.description ? <p className="summary">{company.description}</p> : null}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <EmptyState
            title="企業がまだ登録されていません"
            description="管理画面から監視ソースを追加すると、紐づく企業がここに表示されます。"
            actionHref="/admin/sources/new"
            actionLabel="監視ソースを追加"
          />
        )}
      </main>
      <WidgetPanel />
    </div>
  );
}
