export { getClient, isBackendConfigured } from '@/core/data/client';
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
