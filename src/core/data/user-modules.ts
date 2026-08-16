import { getClient } from '@/core/data/client';
import type { TablesInsert } from '@/core/data/database.types';
import { requireUserId } from '@/core/data/session';

/**
 * The repository layer for per-account module enablement (task 4.5) — see
 * entries.ts for the shape this follows (design D10).
 *
 * Enablement lives on the account, not the device, so signing in on a second
 * device brings the same set of modules with it (module-registry: "Enablement
 * follows the account").
 */

export interface UserModule {
  moduleId: string;
  enabled: boolean;
  position: number;
}

/**
 * The current user's enablement rows. A module with no row has never been
 * touched — absence means "not enabled" (see the user_modules migration), so
 * callers must not treat a missing row as an error.
 */
export async function listUserModules(): Promise<UserModule[]> {
  const { data, error } = await getClient()
    .from('user_modules')
    .select('*')
    .order('position', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    moduleId: row.module_id,
    enabled: row.enabled,
    position: row.position,
  }));
}

/**
 * Enables or disables one module for the current user. Upserts because the
 * first toggle of a module has no row to update, and the primary key is
 * (user_id, module_id) — so a repeated toggle overwrites rather than
 * accumulating rows.
 */
export async function setModuleEnabled(
  moduleId: string,
  enabled: boolean,
): Promise<UserModule> {
  const userId = await requireUserId();

  const row: TablesInsert<'user_modules'> = {
    user_id: userId,
    module_id: moduleId,
    enabled,
  };

  const { data, error } = await getClient()
    .from('user_modules')
    .upsert(row, { onConflict: 'user_id,module_id' })
    .select()
    .single();
  if (error) throw error;

  return {
    moduleId: data.module_id,
    enabled: data.enabled,
    position: data.position,
  };
}
