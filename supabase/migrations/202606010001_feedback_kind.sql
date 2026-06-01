alter table bug_reports
  add column if not exists kind text not null default 'bug';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bug_reports_kind_check'
  ) then
    alter table bug_reports
      add constraint bug_reports_kind_check check (kind in ('bug', 'feature'));
  end if;
end
$$;

create index if not exists bug_reports_kind_status_created_idx on bug_reports (kind, status, created_at desc);
