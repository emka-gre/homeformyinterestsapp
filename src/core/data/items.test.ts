import { getClient } from '@/core/data/client';
import { createItem, deleteItem, getItem, listItems, updateItem } from '@/core/data/items';
import { requireUserId } from '@/core/data/session';
import { createQueryBuilderMock, type QueryBuilderMock } from '@/core/data/test-helpers/query-builder-mock';
import type { Tables } from '@/core/data/database.types';

// See entries.test.ts for why client.ts and session.ts are mocked here.
jest.mock('@/core/data/client', () => ({ getClient: jest.fn() }));
jest.mock('@/core/data/session', () => ({ requireUserId: jest.fn() }));

const mockedGetClient = getClient as jest.MockedFunction<typeof getClient>;
const mockedRequireUserId = requireUserId as jest.MockedFunction<typeof requireUserId>;

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

let builder: QueryBuilderMock;

beforeEach(() => {
  jest.resetAllMocks();
  builder = createQueryBuilderMock();
  mockedGetClient.mockReturnValue(builder as unknown as ReturnType<typeof getClient>);
  mockedRequireUserId.mockResolvedValue('user-1');
});

describe('listItems', () => {
  it('queries the items table newest-first, unfiltered by default', async () => {
    builder.setResult({ data: [row], error: null });

    const result = await listItems();

    expect(builder.from).toHaveBeenCalledWith('items');
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(builder.eq).not.toHaveBeenCalled();
    expect(result[0].name).toBe('Yirgacheffe');
  });

  it('filters by moduleId and itemType together', async () => {
    builder.setResult({ data: [row], error: null });

    await listItems({ moduleId: 'coffee', itemType: 'bean' });

    expect(builder.eq).toHaveBeenCalledWith('module_id', 'coffee');
    expect(builder.eq).toHaveBeenCalledWith('item_type', 'bean');
  });

  it('returns an empty array rather than null when there are no rows', async () => {
    builder.setResult({ data: null, error: null });

    await expect(listItems()).resolves.toEqual([]);
  });
});

describe('getItem', () => {
  it('returns null when no row matches', async () => {
    builder.setResult({ data: null, error: null });

    await expect(getItem('missing')).resolves.toBeNull();
  });
});

describe('createItem', () => {
  it("inserts under the caller's user id", async () => {
    builder.setResult({ data: row, error: null });

    await createItem({ moduleId: 'coffee', itemType: 'bean', name: 'Yirgacheffe', payload: {} });

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', module_id: 'coffee', item_type: 'bean', name: 'Yirgacheffe' }),
    );
  });
});

describe('updateItem', () => {
  it('archives by setting archivedAt, unarchives by clearing it to null', async () => {
    builder.setResult({ data: row, error: null });

    await updateItem('item-1', { archivedAt: '2026-08-16T10:00:00.000Z' });
    expect(builder.update.mock.calls[0][0].archived_at).toBe('2026-08-16T10:00:00.000Z');

    await updateItem('item-1', { archivedAt: null });
    expect(builder.update.mock.calls[1][0].archived_at).toBeNull();
  });

  it('omits payload from the update when the patch does not touch it', async () => {
    builder.setResult({ data: row, error: null });

    await updateItem('item-1', { name: 'Renamed' });

    expect(builder.update.mock.calls[0][0].payload).toBeUndefined();
  });
});

describe('deleteItem', () => {
  it('deletes by id and throws on error', async () => {
    builder.setResult({ data: null, error: { message: 'not found' } });

    await expect(deleteItem('item-1')).rejects.toEqual({ message: 'not found' });
    expect(builder.eq).toHaveBeenCalledWith('id', 'item-1');
  });
});
