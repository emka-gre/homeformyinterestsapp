import type { Json, Tables } from '@/core/data/database.types';
import type { Entry, Item, Place } from '@/core/types/domain';

/**
 * Row-to-domain conversions: snake_case columns to the camelCase shape the
 * rest of the app reads. Kept in one file so a schema change (a renamed
 * column, say) is one diff instead of one per repository.
 */

export function rowToEntry<TPayload = Record<string, unknown>>(
  row: Tables<'entries'>,
): Entry<TPayload> {
  return {
    id: row.id,
    userId: row.user_id,
    moduleId: row.module_id,
    entryType: row.entry_type,
    occurredAt: row.occurred_at,
    status: row.status,
    visibility: row.visibility,
    rating: row.rating,
    notes: row.notes,
    tags: row.tags,
    itemId: row.item_id,
    placeId: row.place_id,
    payload: row.payload as TPayload,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToItem<TPayload = Record<string, unknown>>(
  row: Tables<'items'>,
): Item<TPayload> {
  return {
    id: row.id,
    userId: row.user_id,
    moduleId: row.module_id,
    itemType: row.item_type,
    name: row.name,
    payload: row.payload as TPayload,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToPlace(row: Tables<'places'>): Place {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** A module's payload is opaque here by design (design D2) — this cast is the one place that boundary is crossed, going out to JSONB. */
export function payloadToJson(payload: unknown): Json {
  return payload as Json;
}
