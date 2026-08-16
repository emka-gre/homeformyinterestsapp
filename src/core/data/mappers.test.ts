import { rowToEntry, rowToItem, rowToPlace } from '@/core/data/mappers';
import type { Tables } from '@/core/data/database.types';

describe('rowToEntry', () => {
  const row: Tables<'entries'> = {
    id: 'entry-1',
    user_id: 'user-1',
    module_id: 'coffee',
    entry_type: 'brew',
    occurred_at: '2026-08-16T09:00:00.000Z',
    status: 'done',
    visibility: 'private',
    rating: 4.5,
    notes: 'Bright and floral',
    tags: ['pour-over', 'morning'],
    item_id: 'item-1',
    place_id: 'place-1',
    payload: { method: 'pour-over' },
    created_at: '2026-08-16T09:00:01.000Z',
    updated_at: '2026-08-16T09:00:02.000Z',
  };

  it('maps every snake_case column to its camelCase field', () => {
    expect(rowToEntry(row)).toEqual({
      id: 'entry-1',
      userId: 'user-1',
      moduleId: 'coffee',
      entryType: 'brew',
      occurredAt: '2026-08-16T09:00:00.000Z',
      status: 'done',
      visibility: 'private',
      rating: 4.5,
      notes: 'Bright and floral',
      tags: ['pour-over', 'morning'],
      itemId: 'item-1',
      placeId: 'place-1',
      payload: { method: 'pour-over' },
      createdAt: '2026-08-16T09:00:01.000Z',
      updatedAt: '2026-08-16T09:00:02.000Z',
    });
  });

  it('preserves nulls rather than substituting a default', () => {
    const withNulls: Tables<'entries'> = {
      ...row,
      rating: null,
      notes: null,
      item_id: null,
      place_id: null,
    };
    const entry = rowToEntry(withNulls);
    expect(entry.rating).toBeNull();
    expect(entry.notes).toBeNull();
    expect(entry.itemId).toBeNull();
    expect(entry.placeId).toBeNull();
  });

  it('types the payload as the caller-supplied generic', () => {
    interface BrewPayload {
      method: string;
    }
    const entry = rowToEntry<BrewPayload>(row);
    // Compile-time check as much as runtime: this would fail to typecheck if
    // payload weren't narrowed to BrewPayload.
    expect(entry.payload.method).toBe('pour-over');
  });
});

describe('rowToItem', () => {
  it('maps every snake_case column to its camelCase field', () => {
    const row: Tables<'items'> = {
      id: 'item-1',
      user_id: 'user-1',
      module_id: 'coffee',
      item_type: 'bean',
      name: 'Yirgacheffe',
      payload: { roaster: 'Local Roastery' },
      archived_at: null,
      created_at: '2026-08-16T09:00:00.000Z',
      updated_at: '2026-08-16T09:00:00.000Z',
    };

    expect(rowToItem(row)).toEqual({
      id: 'item-1',
      userId: 'user-1',
      moduleId: 'coffee',
      itemType: 'bean',
      name: 'Yirgacheffe',
      payload: { roaster: 'Local Roastery' },
      archivedAt: null,
      createdAt: '2026-08-16T09:00:00.000Z',
      updatedAt: '2026-08-16T09:00:00.000Z',
    });
  });
});

describe('rowToPlace', () => {
  it('maps every snake_case column to its camelCase field, dropping geog', () => {
    const row: Tables<'places'> = {
      id: 'place-1',
      user_id: 'user-1',
      name: 'Local Roastery Café',
      address: '123 Main St',
      latitude: 52.52,
      longitude: 13.405,
      geog: 'irrelevant-postgis-internal-representation',
      created_at: '2026-08-16T09:00:00.000Z',
      updated_at: '2026-08-16T09:00:00.000Z',
    };

    const place = rowToPlace(row);
    expect(place).toEqual({
      id: 'place-1',
      userId: 'user-1',
      name: 'Local Roastery Café',
      address: '123 Main St',
      latitude: 52.52,
      longitude: 13.405,
      createdAt: '2026-08-16T09:00:00.000Z',
      updatedAt: '2026-08-16T09:00:00.000Z',
    });
    expect(place).not.toHaveProperty('geog');
  });

  it('preserves a null address', () => {
    const row: Tables<'places'> = {
      id: 'place-1',
      user_id: 'user-1',
      name: 'A Park Bench',
      address: null,
      latitude: 0,
      longitude: 0,
      geog: null,
      created_at: '2026-08-16T09:00:00.000Z',
      updated_at: '2026-08-16T09:00:00.000Z',
    };
    expect(rowToPlace(row).address).toBeNull();
  });
});
