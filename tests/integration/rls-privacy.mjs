// Automates the task-2.12 privacy check: two real signed-in accounts, one
// creates data, the other must be unable to read, update, or delete it by
// any path — not just via an unfiltered select.
//
// Runs against a *local* Supabase instance (`supabase start`), never the
// hosted project. Local auth has email confirmation disabled (see
// supabase/config.toml), so plain sign-up/sign-in works without the mailer.
//
// Usage: SUPABASE_URL=... SUPABASE_ANON_KEY=... node tests/integration/rls-privacy.mjs

import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!URL || !ANON_KEY) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY must be set (point at a local `supabase start` instance).');
  process.exit(1);
}

const stamp = Date.now();
const userA = { email: `rls-test-a-${stamp}@nook-testing.local`, password: 'testpassword123!' };
const userB = { email: `rls-test-b-${stamp}@nook-testing.local`, password: 'testpassword123!' };

async function signUp(creds) {
  const client = createClient(URL, ANON_KEY);
  const { data, error } = await client.auth.signUp(creds);
  if (error) throw new Error(`signUp failed for ${creds.email}: ${error.message}`);
  if (!data.session) {
    throw new Error(
      `${creds.email} got no session after sign-up — local email confirmation may be enabled ` +
      '(check supabase/config.toml auth.email.enable_confirmations).',
    );
  }
  return { client, user: data.user };
}

const results = { pass: [], fail: [] };
function check(label, cond, detail) {
  (cond ? results.pass : results.fail).push({ label, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'} — ${label}${detail !== undefined ? ': ' + JSON.stringify(detail) : ''}`);
}

const { client: clientA, user: uA } = await signUp(userA);
const { client: clientB, user: uB } = await signUp(userB);

// Task 6.4 — profile auto-created on sign-in via the on_auth_user_created trigger.
const { data: profileA } = await clientA.from('profiles').select('*').eq('id', uA.id).maybeSingle();
check('profile auto-created for A on sign-up', profileA?.id === uA.id, profileA);

const { data: place, error: placeErr } = await clientA
  .from('places')
  .insert({ user_id: uA.id, name: 'A-only Cafe', latitude: 52.52, longitude: 13.405 })
  .select()
  .single();
check('A can create a place', !placeErr, placeErr?.message);

const { data: item, error: itemErr } = await clientA
  .from('items')
  .insert({ user_id: uA.id, module_id: 'coffee', item_type: 'bean', name: 'A-only Bean', payload: {} })
  .select()
  .single();
check('A can create an item', !itemErr, itemErr?.message);

const { data: entry, error: entryErr } = await clientA
  .from('entries')
  .insert({
    user_id: uA.id,
    module_id: 'coffee',
    entry_type: 'brew',
    occurred_at: new Date().toISOString(),
    notes: 'A-only entry',
    payload: {},
    place_id: place?.id ?? null,
    item_id: item?.id ?? null,
  })
  .select()
  .single();
check('A can create an entry', !entryErr, entryErr?.message);

// B's view into A's data — unfiltered select must return nothing.
const { data: bPlaces, error: bPlacesErr } = await clientB.from('places').select('*');
check("B sees zero of A's places", !bPlacesErr && bPlaces.length === 0, { error: bPlacesErr?.message, rows: bPlaces?.length });

const { data: bItems, error: bItemsErr } = await clientB.from('items').select('*');
check("B sees zero of A's items", !bItemsErr && bItems.length === 0, { error: bItemsErr?.message, rows: bItems?.length });

const { data: bEntries, error: bEntriesErr } = await clientB.from('entries').select('*');
check("B sees zero of A's entries", !bEntriesErr && bEntries.length === 0, { error: bEntriesErr?.message, rows: bEntries?.length });

const { data: bMedia, error: bMediaErr } = await clientB.from('media').select('*');
check("B sees zero of A's media rows", !bMediaErr && bMedia.length === 0, { error: bMediaErr?.message, rows: bMedia?.length });

// Direct-by-id access, not just unfiltered select — a known id is the more
// realistic attack shape (e.g. a guessed or leaked entry id).
if (place) {
  const { data: bPlaceById } = await clientB.from('places').select('*').eq('id', place.id);
  check("B cannot fetch A's place directly by id", (bPlaceById ?? []).length === 0, { rows: bPlaceById });
}
if (entry) {
  const { data: bEntryById } = await clientB.from('entries').select('*').eq('id', entry.id);
  check("B cannot fetch A's entry directly by id", (bEntryById ?? []).length === 0, { rows: bEntryById });

  const { data: updateResult } = await clientB.from('entries').update({ notes: 'hacked by B' }).eq('id', entry.id).select();
  check("B's update of A's entry affects zero rows", (updateResult ?? []).length === 0, { updateResult });

  const { data: deleteResult } = await clientB.from('entries').delete().eq('id', entry.id).select();
  check("B's delete of A's entry affects zero rows", (deleteResult ?? []).length === 0, { deleteResult });
}

// B cannot read A's profile either.
const { data: bProfiles } = await clientB.from('profiles').select('*');
check("B sees only their own profile, not A's", (bProfiles ?? []).every((p) => p.id === uB.id), { rows: bProfiles });

// Anonymous (unauthenticated) access is rejected outright — not filtered to
// zero rows, denied at the grant level (see the two data-api-access migrations).
const anonClient = createClient(URL, ANON_KEY);
const { error: anonErr } = await anonClient.from('entries').select('*');
check('unauthenticated requests are denied at the table-privilege level', !!anonErr, anonErr?.message);

// Positive control — A still sees and can act on their own data throughout.
const { data: aEntries, error: aEntriesErr } = await clientA.from('entries').select('*');
check("A still sees their own entry (positive control)", !aEntriesErr && aEntries.some((e) => e.id === entry?.id), { rows: aEntries?.length });

const { data: aPlaces } = await clientA.from('places').select('*');
check("A still sees their own place (positive control)", (aPlaces ?? []).some((p) => p.id === place?.id));

console.log('\n=== SUMMARY ===');
console.log(`${results.pass.length} passed, ${results.fail.length} failed`);
if (results.fail.length) {
  console.log('FAILURES:', JSON.stringify(results.fail, null, 2));
  process.exit(1);
}
