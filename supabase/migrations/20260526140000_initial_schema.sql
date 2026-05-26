create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  url text not null,
  mode text not null check (mode in ('rss', 'scrape', 'pdf_link')),
  selectors jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  health text not null default 'ok' check (health in ('ok', 'degraded', 'down')),
  last_crawled_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id),
  company_id uuid not null references public.companies(id),
  source_item_id text not null,
  title text not null,
  source_url text not null,
  pdf_url text,
  published_at timestamptz,
  detected_at timestamptz not null default now(),
  summary_short text,
  summary_long text,
  tags text[] not null default '{}',
  content_hash text,
  ai_processed_at timestamptz,
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, source_item_id)
);

create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  word text not null unique,
  reading text,
  meaning text not null,
  tags text[] not null default '{}',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.article_words (
  article_id uuid not null references public.articles(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, word_id)
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  role text not null default 'user' check (role in ('user', 'admin')),
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  origin text not null,
  timezone text not null,
  notify_local_time text not null check (notify_local_time ~ '^[0-9]{2}:(00|30)$'),
  last_notified_on date,
  disabled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.crawl_logs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('ok', 'error', 'skipped')),
  http_status integer,
  message text,
  items_found integer not null default 0,
  items_new integer not null default 0
);

create table if not exists public.admin_login_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  attempted_at timestamptz not null default now(),
  success boolean not null
);

create index if not exists articles_visible_detected_idx
  on public.articles (detected_at desc)
  where hidden_at is null;

create index if not exists sources_enabled_idx
  on public.sources (enabled, deleted_at);

create index if not exists article_words_word_idx
  on public.article_words (word_id, created_at desc);

alter table public.companies enable row level security;
alter table public.sources enable row level security;
alter table public.articles enable row level security;
alter table public.words enable row level security;
alter table public.article_words enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.crawl_logs enable row level security;
alter table public.admin_login_attempts enable row level security;

create policy "anon can read visible articles"
  on public.articles for select
  using (hidden_at is null);

create policy "anon can read enabled sources"
  on public.sources for select
  using (enabled = true and deleted_at is null);

create policy "anon can read companies"
  on public.companies for select
  using (true);

create policy "anon can read active words"
  on public.words for select
  using (deleted_at is null);

create policy "anon can read article words"
  on public.article_words for select
  using (true);

select cron.schedule(
  'pressnote-crawl',
  '*/10 * * * *',
  $$select net.http_post(
    url := current_setting('app.pressnote_base_url', true) || '/api/cron/crawl',
    headers := jsonb_build_object('X-Cron-Secret', current_setting('app.cron_secret', true))
  );$$
);

select cron.schedule(
  'pressnote-ai',
  '*/10 * * * *',
  $$select net.http_post(
    url := current_setting('app.pressnote_base_url', true) || '/api/cron/ai',
    headers := jsonb_build_object('X-Cron-Secret', current_setting('app.cron_secret', true))
  );$$
);

select cron.schedule(
  'pressnote-notify',
  '0,30 * * * *',
  $$select net.http_post(
    url := current_setting('app.pressnote_base_url', true) || '/api/cron/notify',
    headers := jsonb_build_object('X-Cron-Secret', current_setting('app.cron_secret', true))
  );$$
);

select cron.schedule(
  'pressnote-prune',
  '0 18 * * *',
  $$select net.http_post(
    url := current_setting('app.pressnote_base_url', true) || '/api/cron/prune',
    headers := jsonb_build_object('X-Cron-Secret', current_setting('app.cron_secret', true))
  );$$
);
