create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists app_runtime_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table app_runtime_config enable row level security;

do $$
begin
  perform cron.unschedule('pressnote-crawl');
exception when others then
  null;
end $$;

do $$
begin
  perform cron.unschedule('pressnote-notify');
exception when others then
  null;
end $$;

do $$
begin
  perform cron.unschedule('pressnote-usage-rollup');
exception when others then
  null;
end $$;

do $$
begin
  perform cron.unschedule('pressnote-prune');
exception when others then
  null;
end $$;

select cron.schedule(
  'pressnote-crawl',
  '0 21,3,9 * * *',
  $$
  with config as (
    select
      max(value) filter (where key = 'pressnote_origin') as origin,
      max(value) filter (where key = 'cron_secret') as secret
    from public.app_runtime_config
    where key in ('pressnote_origin', 'cron_secret')
  )
  select net.http_get(
    url := rtrim(config.origin, '/') || '/api/cron/crawl?source=' || s.id::text,
    headers := jsonb_build_object('Authorization', 'Bearer ' || config.secret)
  )
  from sources s
  cross join config
  where s.enabled = true
    and config.origin is not null
    and config.secret is not null;
  $$
);

select cron.schedule(
  'pressnote-notify',
  '0 23 * * *',
  $$
  with config as (
    select
      max(value) filter (where key = 'pressnote_origin') as origin,
      max(value) filter (where key = 'cron_secret') as secret
    from public.app_runtime_config
    where key in ('pressnote_origin', 'cron_secret')
  )
  select net.http_get(
    url := rtrim(config.origin, '/') || '/api/cron/notify',
    headers := jsonb_build_object('Authorization', 'Bearer ' || config.secret)
  )
  from config
  where config.origin is not null
    and config.secret is not null;
  $$
);

select cron.schedule(
  'pressnote-usage-rollup',
  '5 15 * * *',
  $$
  with config as (
    select
      max(value) filter (where key = 'pressnote_origin') as origin,
      max(value) filter (where key = 'cron_secret') as secret
    from public.app_runtime_config
    where key in ('pressnote_origin', 'cron_secret')
  )
  select net.http_get(
    url := rtrim(config.origin, '/') || '/api/cron/usage-rollup',
    headers := jsonb_build_object('Authorization', 'Bearer ' || config.secret)
  )
  from config
  where config.origin is not null
    and config.secret is not null;
  $$
);

select cron.schedule(
  'pressnote-prune',
  '0 18 * * 6',
  $$
  with config as (
    select
      max(value) filter (where key = 'pressnote_origin') as origin,
      max(value) filter (where key = 'cron_secret') as secret
    from public.app_runtime_config
    where key in ('pressnote_origin', 'cron_secret')
  )
  select net.http_get(
    url := rtrim(config.origin, '/') || '/api/cron/prune',
    headers := jsonb_build_object('Authorization', 'Bearer ' || config.secret)
  )
  from config
  where config.origin is not null
    and config.secret is not null;
  $$
);
