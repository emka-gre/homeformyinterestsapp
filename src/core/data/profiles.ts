import { getClient } from '@/core/data/client';
import type { Tables, TablesUpdate } from '@/core/data/database.types';
import { requireUserId } from '@/core/data/session';
import type { Profile } from '@/core/types/domain';

/**
 * The repository layer for the user's own profile (tasks 6.4–6.5) — see
 * entries.ts for the shape this follows (design D10).
 *
 * There is no create function: the profile row is inserted by a database
 * trigger the moment the auth user is, with a display name derived from the
 * email (user-account: "Default display name"). So a signed-in user always
 * has one, and a missing row is a genuine error rather than a state to
 * handle.
 */

function rowToProfile(row: Tables<'profiles'>): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** The current user's profile. RLS scopes the select to the owner, so no filter is needed. */
export async function getProfile(): Promise<Profile> {
  const { data, error } = await getClient().from('profiles').select('*').single();
  if (error) throw error;
  return rowToProfile(data);
}

export interface ProfilePatch {
  displayName?: string;
}

export async function updateProfile(patch: ProfilePatch): Promise<Profile> {
  const userId = await requireUserId();

  const update: TablesUpdate<'profiles'> = {
    display_name: patch.displayName?.trim(),
  };

  const { data, error } = await getClient()
    .from('profiles')
    .update(update)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return rowToProfile(data);
}
