// getClient is deliberately not re-exported here — only files inside
// src/core/data/ may call it (design D10). Import it from
// '@/core/data/client' directly if you're adding a repository, not through
// this barrel; the eslint rule below only catches that direct-import path.
export { isBackendConfigured } from '@/core/data/client';
export { requireUserId } from '@/core/data/session';

export {
  createEntry,
  deleteEntry,
  getEntry,
  listEntries,
  updateEntry,
  type EntryPatch,
  type NewEntryInput,
} from '@/core/data/entries';

export {
  createItem,
  deleteItem,
  getItem,
  listItems,
  updateItem,
  type ItemPatch,
  type NewItemInput,
} from '@/core/data/items';

export {
  createPlace,
  deletePlace,
  getPlace,
  listPlaces,
  updatePlace,
  type NewPlaceInput,
  type PlacePatch,
} from '@/core/data/places';

export { queryKeys } from '@/core/data/query-keys';

export { useCreateEntry, useDeleteEntry, useEntries, useEntry, useUpdateEntry } from '@/core/data/use-entries';
export { useCreateItem, useDeleteItem, useItem, useItems, useUpdateItem } from '@/core/data/use-items';
export { usePlace, usePlaces } from '@/core/data/use-places';
