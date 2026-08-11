-- Task 2.10 — the friends-visibility branch, shipped dormant.
--
-- No friend graph exists in v0, so this returns false and the effective policy
-- everywhere is owner-only (design D5). It exists as a function rather than as
-- inline SQL precisely so the feed needs no policy rewrite later: when the
-- friend graph lands, only this function body changes, and every policy that
-- calls it starts working. Rewriting policies across five tables is the
-- migration this avoids.

create or replace function public.is_friend(other_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select false;
$$;

comment on function public.is_friend(uuid) is
  'Dormant in v0: always false. Replace the body when the friend graph ships; '
  'do not change the policies that call it.';
