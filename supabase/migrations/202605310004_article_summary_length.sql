alter table articles drop constraint if exists articles_summary_check;
alter table articles add constraint articles_summary_check check (char_length(summary) <= 120);
