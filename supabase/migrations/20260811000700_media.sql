-- Task 2.6 — media: owner, storage path, polymorphic attachment to an entry
-- or an item.
-- Task 2.9 — RLS enabled at creation.

create table public.media (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,
  mime_type    text,
  width        integer check (width > 0),
  height       integer check (height > 0),
  byte_size    bigint check (byte_size > 0),
  position     integer not null default 0,

  -- Media attached solely to an entry dies with it (entry-logging).
  entry_id     uuid references public.entries (id) on delete cascade,
  item_id      uuid references public.items (id) on delete cascade,

  created_at   timestamptz not null default now(),

  -- Exactly one owner record. A photo floating free of both would be
  -- unreachable in the UI and invisible to the deletion rules above.
  constraint media_attached_to_exactly_one check (
    (entry_id is not null)::int + (item_id is not null)::int = 1
  )
);

create index media_entry_idx on public.media (entry_id, position)
  where entry_id is not null;
create index media_item_idx on public.media (item_id, position)
  where item_id is not null;
create index media_user_idx on public.media (user_id);

alter table public.media enable row level security;

-- Attached content is no more accessible than what it hangs off
-- (entry-privacy). Rather than restate the visibility rule, this defers to the
-- owning row's own policy: if the reader cannot see the entry, the EXISTS
-- finds nothing and the media is denied.
create policy media_select_visible on public.media
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.entries e
      where e.id = media.entry_id
    )
    or exists (
      select 1 from public.items i
      where i.id = media.item_id
    )
  );

create policy media_insert_own on public.media
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy media_update_own on public.media
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy media_delete_own on public.media
  for delete to authenticated
  using ((select auth.uid()) = user_id);
