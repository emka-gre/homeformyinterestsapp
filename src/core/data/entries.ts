import { getClient } from '@/core/data/client';
import type { TablesInsert, TablesUpdate } from '@/core/data/database.types';
import { payloadToJson, rowToEntry } from '@/core/data/mappers';
import { requireUserId } from '@/core/data/session';
import type { Entry, EntryStatus, EntryVisibility } from '@/core/types/domain';

/**
 * The repository layer for entries — the only code allowed to call the
 * backend client for this table (design D10). Every mutation here is async
 * and touches nothing but this table's row shape, so a later offline queue
 * slots in behind these functions without callers changing.
 */

export interface NewEntryInput<TPayload = Record<string, unknown>> {
  moduleId: string;
  entryType: string;
  payload: TPayload;
  /** Defaults to now() in the database if omitted. */
  occurredAt?: string;
  /** Defaults to 'done'. */
  status?: EntryStatus;
  /** Defaults to 'private' (entry-privacy). */
  visibility?: EntryVisibility;
  rating?: number | null;
  notes?: string | null;
  tags?: string[];
  itemId?: string | null;
  placeId?: string | null;
}

export type EntryPatch<TPayload = Record<string, unknown>> = Partial<
  Omit<NewEntryInput<TPayload>, 'moduleId' | 'entryType'>
>;

/** All of the current user's entries, newest first (the timeline's order). Optionally scoped to one module (a module's own library view). */
export async function listEntries<TPayload = Record<string, unknown>>(
  moduleId?: string,
): Promise<Entry<TPayload>[]> {
  let query = getClient()
    .from('entries')
    .select('*')
    .order('occurred_at', { ascending: false });

  if (moduleId) {
    query = query.eq('module_id', moduleId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => rowToEntry<TPayload>(row));
}

export async function getEntry<TPayload = Record<string, unknown>>(
  id: string,
): Promise<Entry<TPayload> | null> {
  const { data, error } = await getClient()
    .from('entries')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToEntry<TPayload>(data) : null;
}

export async function createEntry<TPayload = Record<string, unknown>>(
  input: NewEntryInput<TPayload>,
): Promise<Entry<TPayload>> {
  const userId = await requireUserId();

  const insert: TablesInsert<'entries'> = {
    user_id: userId,
    module_id: input.moduleId,
    entry_type: input.entryType,
    occurred_at: input.occurredAt,
    status: input.status,
    visibility: input.visibility,
    rating: input.rating,
    notes: input.notes,
    tags: input.tags,
    item_id: input.itemId,
    place_id: input.placeId,
    payload: payloadToJson(input.payload),
  };

  const { data, error } = await getClient()
    .from('entries')
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return rowToEntry<TPayload>(data);
}

export async function updateEntry<TPayload = Record<string, unknown>>(
  id: string,
  patch: EntryPatch<TPayload>,
): Promise<Entry<TPayload>> {
  const update: TablesUpdate<'entries'> = {
    occurred_at: patch.occurredAt,
    status: patch.status,
    visibility: patch.visibility,
    rating: patch.rating,
    notes: patch.notes,
    tags: patch.tags,
    item_id: patch.itemId,
    place_id: patch.placeId,
    payload: patch.payload === undefined ? undefined : payloadToJson(patch.payload),
  };

  const { data, error } = await getClient()
    .from('entries')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToEntry<TPayload>(data);
}

/** Media attached solely to this entry is cascade-deleted by the database (entry-logging); nothing extra to clean up here. */
export async function deleteEntry(id: string): Promise<void> {
  const { error } = await getClient().from('entries').delete().eq('id', id);
  if (error) throw error;
}
