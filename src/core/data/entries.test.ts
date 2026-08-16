import { getClient } from '@/core/data/client';
import {
  createEntry,
  deleteEntry,
  getEntry,
  listEntries,
  updateEntry,
} from '@/core/data/entries';
import { requireUserId } from '@/core/data/session';
import { createQueryBuilderMock, type QueryBuilderMock } from '@/core/data/test-helpers/query-builder-mock';
import type { Tables } from '@/core/data/database.types';

// Mocked so this stays a unit test: client.ts pulls in native AsyncStorage,
// which crashes outside a running app (see use-entries.test.tsx). session.ts
// is mocked too — requireUserId's own logic is covered in session.test.ts.
jest.mock('@/core/data/client', () => ({ getClient: jest.fn() }));
jest.mock('@/core/data/session', () => ({ requireUserId: jest.fn() }));

const mockedGetClient = getClient as jest.MockedFunction<typeof getClient>;
const mockedRequireUserId = requireUserId as jest.MockedFunction<typeof requireUserId>;

const row: Tables<'entries'> = {
  id: 'entry-1',
  user_id: 'user-1',
  module_id: 'coffee',
  entry_type: 'brew',
  occurred_at: '2026-08-16T09:00:00.000Z',
  status: 'done',
  visibility: 'private',
  rating: 4.5,
  notes: null,
  tags: [],
  item_id: null,
  place_id: null,
  payload: { method: 'pour-over' },
  created_at: '2026-08-16T09:00:01.000Z',
  updated_at: '2026-08-16T09:00:02.000Z',
};

let builder: QueryBuilderMock;

beforeEach(() => {
  jest.resetAllMocks();
  builder = createQueryBuilderMock();
  mockedGetClient.mockReturnValue(builder as unknown as ReturnType<typeof getClient>);
  mockedRequireUserId.mockResolvedValue('user-1');
});

describe('listEntries', () => {
  it('queries the entries table ordered newest-first, unfiltered', async () => {
    builder.setResult({ data: [row], error: null });

    const result = await listEntries();

    expect(builder.from).toHaveBeenCalledWith('entries');
    expect(builder.order).toHaveBeenCalledWith('occurred_at', { ascending: false });
    expect(builder.eq).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('entry-1');
  });

  it('scopes to one module when given a moduleId', async () => {
    builder.setResult({ data: [row], error: null });

    await listEntries('coffee');

    expect(builder.eq).toHaveBeenCalledWith('module_id', 'coffee');
  });

  it('returns an empty array rather than null when there are no rows', async () => {
    builder.setResult({ data: null, error: null });

    await expect(listEntries()).resolves.toEqual([]);
  });

  it('throws the Postgrest error instead of swallowing it', async () => {
    builder.setResult({ data: null, error: { message: 'connection reset' } });

    await expect(listEntries()).rejects.toEqual({ message: 'connection reset' });
  });
});

describe('getEntry', () => {
  it('returns null when no row matches, rather than throwing', async () => {
    builder.setResult({ data: null, error: null });

    await expect(getEntry('missing')).resolves.toBeNull();
    expect(builder.eq).toHaveBeenCalledWith('id', 'missing');
  });

  it('maps the row to a domain entry when one matches', async () => {
    builder.setResult({ data: row, error: null });

    const entry = await getEntry('entry-1');

    expect(entry?.moduleId).toBe('coffee');
  });
});

describe('createEntry', () => {
  it("inserts under the caller's user id, not a value the caller can pass in", async () => {
    builder.setResult({ data: row, error: null });

    await createEntry({ moduleId: 'coffee', entryType: 'brew', payload: { method: 'pour-over' } });

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', module_id: 'coffee', entry_type: 'brew' }),
    );
  });

  it('leaves status/visibility undefined when not given, so the column default applies', async () => {
    builder.setResult({ data: row, error: null });

    await createEntry({ moduleId: 'coffee', entryType: 'brew', payload: {} });

    const insertArg = builder.insert.mock.calls[0][0];
    expect(insertArg.status).toBeUndefined();
    expect(insertArg.visibility).toBeUndefined();
  });
});

describe('updateEntry', () => {
  it('omits payload from the update when the patch does not touch it', async () => {
    builder.setResult({ data: row, error: null });

    await updateEntry('entry-1', { rating: 5 });

    const updateArg = builder.update.mock.calls[0][0];
    expect(updateArg.payload).toBeUndefined();
    expect(updateArg.rating).toBe(5);
    expect(builder.eq).toHaveBeenCalledWith('id', 'entry-1');
  });

  it('sends an explicit null to clear a field, distinct from leaving it out', async () => {
    builder.setResult({ data: row, error: null });

    await updateEntry('entry-1', { notes: null });

    expect(builder.update.mock.calls[0][0].notes).toBeNull();
  });
});

describe('deleteEntry', () => {
  it('deletes by id and throws on error', async () => {
    builder.setResult({ data: null, error: { message: 'not found' } });

    await expect(deleteEntry('entry-1')).rejects.toEqual({ message: 'not found' });
    expect(builder.eq).toHaveBeenCalledWith('id', 'entry-1');
  });
});
