-- Task 2.3 — places: owner, name, coordinates.
-- Task 2.9 — RLS enabled at creation.

create table public.places (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null check (length(trim(name)) > 0),
  address    text,
  latitude   double precision not null check (latitude between -90 and 90),
  longitude  double precision not null check (longitude between -180 and 180),
  -- Latitude and longitude are stored plainly so clients read them without
  -- knowing PostGIS; the generated column is what proximity queries and the
  -- spatial index use.
  geog extensions.geography(Point, 4326)
    generated always as (
      extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
    ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index places_user_id_idx on public.places (user_id);
create index places_geog_idx on public.places using gist (geog);

create trigger places_set_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

alter table public.places enable row level security;

create policy places_select_own on public.places
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy places_insert_own on public.places
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy places_update_own on public.places
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy places_delete_own on public.places
  for delete to authenticated
  using ((select auth.uid()) = user_id);
