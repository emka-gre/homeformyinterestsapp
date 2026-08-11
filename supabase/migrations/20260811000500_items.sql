-- Task 2.4 — items: owner, module id, item type, name, JSONB payload.
-- Task 2.9 — RLS enabled at creation.
--
-- `module_id` and `item_type` are plain text, not enums or foreign keys: core
-- must not know the set of modules (design D2), and a new module must not
-- require a migration (design D4).

create table public.items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  module_id   text not null check (length(trim(module_id)) > 0),
  item_type   text not null check (length(trim(item_type)) > 0),
  name        text not null check (length(trim(name)) > 0),
  payload     jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index items_user_id_idx on public.items (user_id);
create index items_module_idx on public.items (user_id, module_id, item_type);

create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

alter table public.items enable row level security;

create policy items_select_own on public.items
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy items_insert_own on public.items
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy items_update_own on public.items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy items_delete_own on public.items
  for delete to authenticated
  using ((select auth.uid()) = user_id);
