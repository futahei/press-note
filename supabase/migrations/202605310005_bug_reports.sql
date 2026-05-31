create table if not exists bug_reports (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  path text not null,
  user_agent text,
  viewport text,
  language text,
  timezone text,
  logs jsonb not null default '[]'::jsonb,
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists bug_reports_status_created_idx on bug_reports (status, created_at desc);

alter table bug_reports enable row level security;
