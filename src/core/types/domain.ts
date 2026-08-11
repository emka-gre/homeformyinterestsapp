/**
 * The shared domain every module logs into (design D1). These mirror the SQL
 * in supabase/migrations; once the hosted project exists they can be replaced
 * by `supabase gen types typescript`, which is task 3.1's intent.
 */

export type EntryStatus = 'planned' | 'in_progress' | 'done';
export type EntryVisibility = 'private' | 'friends' | 'public';

/** A timestamped event: a brew, a session, a gallery visit. */
export interface Entry<TPayload = Record<string, unknown>> {
  id: string;
  userId: string;
  moduleId: string;
  entryType: string;
  /** When the activity happened — not when the row was written (entry-logging). */
  occurredAt: string;
  status: EntryStatus;
  visibility: EntryVisibility;
  /** Core, not payload, so it is queryable across modules (design D1). */
  rating: number | null;
  notes: string | null;
  tags: string[];
  itemId: string | null;
  placeId: string | null;
  payload: TPayload;
  createdAt: string;
  updatedAt: string;
}

/** A reusable thing you own or reference: a bag of beans, a recipe. */
export interface Item<TPayload = Record<string, unknown>> {
  id: string;
  userId: string;
  moduleId: string;
  itemType: string;
  name: string;
  payload: TPayload;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A spot on a map: a café, a gym, a gallery. */
export interface Place {
  id: string;
  userId: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

/** A photo, attached to exactly one entry or one item. */
export interface Media {
  id: string;
  userId: string;
  storagePath: string;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  byteSize: number | null;
  position: number;
  entryId: string | null;
  itemId: string | null;
  createdAt: string;
}
