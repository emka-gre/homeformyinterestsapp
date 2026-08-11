-- Extensions and shared helpers.
--
-- PostGIS backs the places map (design D8). Supabase convention is to install
-- extensions into the `extensions` schema rather than `public`.

create extension if not exists postgis with schema extensions;

-- Every table carrying `updated_at` uses this trigger, so "records that the
-- entry was modified" (entry-logging) is a database guarantee rather than
-- something each write path must remember.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
