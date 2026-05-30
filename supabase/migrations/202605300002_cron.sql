create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'pressnote-crawl',
  '0 21,3,9 * * *',
  $$
  select net.http_get(
    url := current_setting('app.pressnote_origin', true) || '/api/cron/crawl?source=' || s.id::text,
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret', true))
  )
  from sources s where s.enabled = true;
  $$
);

select cron.schedule(
  'pressnote-notify',
  '0 23 * * *',
  $$
  select net.http_get(
    url := current_setting('app.pressnote_origin', true) || '/api/cron/notify',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret', true))
  );
  $$
);

select cron.schedule(
  'pressnote-usage-rollup',
  '5 15 * * *',
  $$
  select net.http_get(
    url := current_setting('app.pressnote_origin', true) || '/api/cron/usage-rollup',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret', true))
  );
  $$
);

select cron.schedule(
  'pressnote-prune',
  '0 18 * * 6',
  $$
  select net.http_get(
    url := current_setting('app.pressnote_origin', true) || '/api/cron/prune',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret', true))
  );
  $$
);
