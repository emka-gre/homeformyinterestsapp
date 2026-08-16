-- Task 2.9 supplement — remove `anon` table privileges granted by
-- "automatically expose new tables" (left on at project creation).
--
-- RLS already reduces anon access to zero rows on every table (every policy
-- checks auth.uid() = user_id, which is null for unauthenticated requests),
-- so this isn't closing an active leak. It restores the intended two-layer
-- posture (design D5, entry-privacy): table-level privilege as well as RLS,
-- so a future table that ships without a correct RLS policy fails closed
-- (no grant → no access) rather than failing open (world-readable until
-- someone notices).

revoke select, insert, update, delete on
  public.profiles,
  public.places,
  public.items,
  public.entries,
  public.media,
  public.user_modules,
  public.entry_links
from anon;

revoke usage on schema public from anon;
