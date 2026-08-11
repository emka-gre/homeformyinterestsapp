-- Task 2.7 — per-account module enablement.
-- Task 2.9 — RLS enabled at creation.
--
-- Absence of a row means "not enabled", so enabling the first module needs no
-- backfill for existing accounts.

create table public.user_modules (
  user_id    uuid not null references auth.users (id) on delete cascade,
  module_id  text not null check (length(trim(module_id)) > 0),
  enabled    boolean not null default true,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

create trigger user_modules_set_updated_at
  before update on public.user_modules
  for each row execute function public.set_updated_at();

alter table public.user_modules enable row level security;

create policy user_modules_select_own on public.user_modules
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy user_modules_insert_own on public.user_modules
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy user_modules_update_own on public.user_modules
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy user_modules_delete_own on public.user_modules
  for delete to authenticated
  using ((select auth.uid()) = user_id);
