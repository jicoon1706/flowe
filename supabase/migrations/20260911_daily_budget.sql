-- A daily spending budget, for the live update Flowe shows when it files a
-- payment it caught outside the app.
--
-- Per user rather than per account: the question the update answers is "how
-- much of today have I spent", not "how much is left in Maybank". Null means
-- the user hasn't set one, and nothing is shown.

alter table public.settings
  add column if not exists daily_budget numeric(12, 2)
    check (daily_budget is null or daily_budget > 0);

comment on column public.settings.daily_budget is
  'Intended spend per day, in RM. Null = no budget set (live updates off).';
