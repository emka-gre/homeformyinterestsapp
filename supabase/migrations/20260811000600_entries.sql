-- Task 2.5 — entries, the shared record every module logs into (design D4).
-- Task 2.9 — RLS enabled at creation.
-- Task 2.10 — the friends branch is present but dormant.

-- Both enums ship complete even though no v0 UI produces a non-default value
-- (design D5, D7). Adding a value to a live enum later is the migration this
-- avoids; the cost now is one line each.
create type public.entry_status as enum ('planned', 'in_progress', 'done');
create type public.entry_visibility as enum ('private', 'friends', 'public');

create table public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  module_id   text not null check (length(trim(module_id)) > 0),
  entry_type  text not null check (length(trim(entry_type)) > 0),

  occurred_at timestamptz not null default now(),
  status      public.entry_status not null default 'done',
  visibility  public.entry_visibility not null default 'private',

  -- Core, not payload: cross-module querying is the whole value proposition,
  -- and a rating inside a JSONB blob throws it away (design D1).
  rating      numeric(2, 1) check (rating >= 0 and rating <= 5),
  notes       text,
  tags        text[] not null default '{}',

  -- Deleting an item or place leaves the entries that referenced it intact
  -- with the reference cleared (entry-logging).
  item_id     uuid references public.items (id) on delete set null,
  place_id    uuid references public.places (id) on delete set null,

  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- The timeline reads newest-first per user; this index is the one that matters.
create index entries_timeline_idx
  on public.entries (user_id, occurred_at desc);
create index entries_module_idx
  on public.entries (user_id, module_id, entry_type);
create index entries_rating_idx
  on public.entries (user_id, rating) where rating is not null;
create index entries_tags_idx on public.entries using gin (tags);
create index entries_item_idx on public.entries (item_id) where item_id is not null;
create index entries_place_idx on public.entries (place_id) where place_id is not null;

create trigger entries_set_updated_at
  before update on public.entries
  for each row execute function public.set_updated_at();

alter table public.entries enable row level security;

-- Owner reads their own entries irrespective of visibility; everyone else is
-- denied unless the entry is shared AND the reader is a friend — which
-- `is_friend` refuses for every caller in v0 (design D5).
create policy entries_select_visible on public.entries
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    or (
      visibility in ('friends', 'public')
      and public.is_friend(user_id)
    )
  );

-- Insert is owner-only and cannot opt out of the private default: a capture
-- flow that omits visibility gets `private` from the column default, and one
-- that names another user is rejected here (entry-privacy).
create policy entries_insert_own on public.entries
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy entries_update_own on public.entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy entries_delete_own on public.entries
  for delete to authenticated
  using ((select auth.uid()) = user_id);
