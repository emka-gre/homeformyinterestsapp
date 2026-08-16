import { getClient } from '@/core/data/client';
import type { TablesInsert, TablesUpdate } from '@/core/data/database.types';
import { payloadToJson, rowToItem } from '@/core/data/mappers';
import { requireUserId } from '@/core/data/session';
import type { Item } from '@/core/types/domain';

/** The repository layer for items — see entries.ts for the shape this follows (design D10). */

export interface NewItemInput<TPayload = Record<string, unknown>> {
  moduleId: string;
  itemType: string;
  name: string;
  payload: TPayload;
}

export type ItemPatch<TPayload = Record<string, unknown>> = Partial<{
  name: string;
  payload: TPayload;
  /** Set to archive; clear to unarchive. Deletion is separate — see deleteItem. */
  archivedAt: string | null;
}>;

/** All of the current user's items, newest first. Optionally scoped to one module and/or item type (a bean picker scoped to Coffee, say). */
export async function listItems<TPayload = Record<string, unknown>>(
  filter: { moduleId?: string; itemType?: string } = {},
): Promise<Item<TPayload>[]> {
  let query = getClient()
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter.moduleId) {
    query = query.eq('module_id', filter.moduleId);
  }
  if (filter.itemType) {
    query = query.eq('item_type', filter.itemType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => rowToItem<TPayload>(row));
}

export async function getItem<TPayload = Record<string, unknown>>(
  id: string,
): Promise<Item<TPayload> | null> {
  const { data, error } = await getClient()
    .from('items')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToItem<TPayload>(data) : null;
}

export async function createItem<TPayload = Record<string, unknown>>(
  input: NewItemInput<TPayload>,
): Promise<Item<TPayload>> {
  const userId = await requireUserId();

  const insert: TablesInsert<'items'> = {
    user_id: userId,
    module_id: input.moduleId,
    item_type: input.itemType,
    name: input.name,
    payload: payloadToJson(input.payload),
  };

  const { data, error } = await getClient()
    .from('items')
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return rowToItem<TPayload>(data);
}

export async function updateItem<TPayload = Record<string, unknown>>(
  id: string,
  patch: ItemPatch<TPayload>,
): Promise<Item<TPayload>> {
  const update: TablesUpdate<'items'> = {
    name: patch.name,
    archived_at: patch.archivedAt,
    payload: patch.payload === undefined ? undefined : payloadToJson(patch.payload),
  };

  const { data, error } = await getClient()
    .from('items')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToItem<TPayload>(data);
}

/** Entries referencing this item have their item_id cleared, not deleted (on delete set null — entry-logging: "Deleting an item ... leaves the entries that referenced it intact"). Callers implement the confirmation warning (task 9.6); this just performs the delete. */
export async function deleteItem(id: string): Promise<void> {
  const { error } = await getClient().from('items').delete().eq('id', id);
  if (error) throw error;
}
