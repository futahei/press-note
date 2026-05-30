alter table reports
  add column if not exists reason text not null default 'not_press_release'
  check (reason in ('not_press_release','duplicate'));
