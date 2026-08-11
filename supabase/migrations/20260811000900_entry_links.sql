-- Task 2.8 — entry_links per design D6. Created now, unused in v0.
--
-- "This espresso, at this café, while reading this book" is a v1.5 feature.
-- The shape is fixed now so it costs no migration then. Core owns the
-- relation; modules stay ignorant of it.
-- Task 2.9 — RLS enabled at creation, dormant table or not.

create type public.linkable_type as enum ('entry', 'item', 'place');
create type public.link_relation as enum ('with', 'at', 'inspired-by');

create table public.entry_links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  source_type public.linkable_type not null,
  source_id   uuid not null,
  target_type public.linkable_type not null,
  target_id   uuid not null,
  relation    public.link_relation not null,
  created_at  timestamptz not null default now(),

  -- A link from a thing to itself is always a mistake.
  constraint entry_links_not_self check (
    not (source_type = target_type and source_id = target_id)
  ),
  constraint entry_links_unique unique (
    user_id, source_type, source_id, target_type, target_id, relation
  )
);

-- Deliberately no foreign keys: the endpoints are polymorphic across three
-- tables, and a trigger-enforced alternative would be machinery in service of
-- a table nothing writes to yet. Integrity is enforced when the linking UI
-- lands (design D6).

create index entry_links_source_idx
  on public.entry_links (user_id, source_type, source_id);
create index entry_links_target_idx
  on public.entry_links (user_id, target_type, target_id);

alter table public.entry_links enable row level security;

create policy entry_links_select_own on public.entry_links
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy entry_links_insert_own on public.entry_links
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy entry_links_update_own on public.entry_links
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy entry_links_delete_own on public.entry_links
  for delete to authenticated
  using ((select auth.uid()) = user_id);
