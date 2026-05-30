create extension if not exists pgcrypto;

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  enabled boolean not null default true,
  last_crawled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  url text not null unique,
  title text not null,
  summary text not null check (char_length(summary) <= 100),
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create index if not exists articles_published_at_idx on articles (published_at desc);
create index if not exists articles_source_published_idx on articles (source_id, published_at desc);

create table if not exists terms (
  id uuid primary key default gen_random_uuid(),
  headword text not null unique,
  reading text not null,
  description text not null,
  source_kind text not null check (source_kind in ('ai','manual')),
  status text not null default 'published' check (status in ('published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists terms_reading_idx on terms (reading);

create table if not exists article_terms (
  article_id uuid not null references articles(id) on delete cascade,
  term_id uuid not null references terms(id) on delete cascade,
  primary key (article_id, term_id)
);

create index if not exists article_terms_term_id_idx on article_terms (term_id);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  reason text not null default 'not_press_release' check (reason in ('not_press_release','duplicate')),
  status text not null default 'open' check (status in ('open','accepted','rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index if not exists reports_one_open_per_article_idx on reports (article_id) where status = 'open';

create table if not exists rejected_article_urls (
  url text primary key,
  article_id uuid references articles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table if not exists llm_usage_logs (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  model text not null,
  purpose text not null,
  input_tokens integer not null,
  output_tokens integer not null,
  cost_usd numeric(10,6) not null,
  source_id uuid references sources(id) on delete set null,
  article_id uuid references articles(id) on delete set null
);

create index if not exists llm_usage_logs_occurred_at_idx on llm_usage_logs (occurred_at desc);

create or replace view terms_with_article_count
with (security_invoker = true) as
select
  t.*,
  count(at.article_id)::integer as article_count
from terms t
left join article_terms at on at.term_id = t.id
left join articles a on a.id = at.article_id and a.is_deleted = false
group by t.id;

create or replace view llm_usage_daily
with (security_invoker = true) as
select
  date_trunc('day', occurred_at)::date as usage_date,
  model,
  sum(input_tokens)::integer as input_tokens,
  sum(output_tokens)::integer as output_tokens,
  sum(cost_usd)::numeric(10,6) as cost_usd
from llm_usage_logs
group by 1, 2
order by 1;

alter table sources enable row level security;
alter table articles enable row level security;
alter table terms enable row level security;
alter table article_terms enable row level security;
alter table reports enable row level security;
alter table rejected_article_urls enable row level security;
alter table push_subscriptions enable row level security;
alter table llm_usage_logs enable row level security;
