alter table terms
  add column if not exists status text not null default 'published' check (status in ('published'));

create unique index if not exists reports_one_open_per_article_idx on reports (article_id) where status = 'open';

create table if not exists rejected_article_urls (
  url text primary key,
  article_id uuid references articles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table rejected_article_urls enable row level security;
