do $$
begin
  perform cron.unschedule('pressnote-crawl');
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
