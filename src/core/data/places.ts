import { getClient } from '@/core/data/client';
import type { TablesInsert, TablesUpdate } from '@/core/data/database.types';
import { rowToPlace } from '@/core/data/mappers';
import { requireUserId } from '@/core/data/session';
import type { Place } from '@/core/types/domain';

/** The repository layer for places — see entries.ts for the shape this follows (design D10). */

export interface NewPlaceInput {
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
}

export type PlacePatch = Partial<NewPlaceInput>;

/** All of the current user's places. No module scoping — places are shared across every module that uses them (usesPlaces). */
export async function listPlaces(): Promise<Place[]> {
  const { data, error } = await getClient()
    .from('places')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToPlace);
}

export async function getPlace(id: string): Promise<Place | null> {
  const { data, error } = await getClient()
    .from('places')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToPlace(data) : null;
}

export async function createPlace(input: NewPlaceInput): Promise<Place> {
  const userId = await requireUserId();

  const insert: TablesInsert<'places'> = {
    user_id: userId,
    name: input.name,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
  };

  const { data, error } = await getClient()
    .from('places')
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return rowToPlace(data);
}

/** A rename here is visible everywhere without extra work — entries reference place_id, not a copy of the name (task 8.7). */
export async function updatePlace(id: string, patch: PlacePatch): Promise<Place> {
  const update: TablesUpdate<'places'> = {
    name: patch.name,
    address: patch.address,
    latitude: patch.latitude,
    longitude: patch.longitude,
  };

  const { data, error } = await getClient()
    .from('places')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToPlace(data);
}

/** Entries referencing this place have their place_id cleared, not deleted (on delete set null). */
export async function deletePlace(id: string): Promise<void> {
  const { error } = await getClient().from('places').delete().eq('id', id);
  if (error) throw error;
}
