-- Task 2.9 supplement — explicit Data API grants.
--
-- Supabase's Data API (PostgREST) only reaches a table if the querying role
-- (`anon`, `authenticated`) has been granted SQL privileges on it; RLS then
-- restricts which *rows* a query against an allowed table can see. These are
-- separate layers — granting table access here does not weaken row-level
-- privacy, since every table's RLS policies already restrict to the owning
-- user (entry-privacy).
--
-- Written explicitly because "automatically expose new tables" is off (the
-- current recommended project setting, and the only supported behaviour
-- after 2026-10-30, when Supabase removes the legacy auto-expose path).
--
-- No grants to `anon`: every read and write path in this app requires a
-- signed-in user (design D5), so unauthenticated callers get nothing at the
-- table level — the same outcome RLS would produce anyway, just enforced one
-- layer earlier.

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.places,
  public.items,
  public.entries,
  public.media,
  public.user_modules,
  public.entry_links
to authenticated;
