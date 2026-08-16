import { getClient } from '@/core/data/client';
import { createPlace, deletePlace, getPlace, listPlaces, updatePlace } from '@/core/data/places';
import { requireUserId } from '@/core/data/session';
import { createQueryBuilderMock, type QueryBuilderMock } from '@/core/data/test-helpers/query-builder-mock';
import type { Tables } from '@/core/data/database.types';

// See entries.test.ts for why client.ts and session.ts are mocked here.
jest.mock('@/core/data/client', () => ({ getClient: jest.fn() }));
jest.mock('@/core/data/session', () => ({ requireUserId: jest.fn() }));

const mockedGetClient = getClient as jest.MockedFunction<typeof getClient>;
const mockedRequireUserId = requireUserId as jest.MockedFunction<typeof requireUserId>;

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

let builder: QueryBuilderMock;

beforeEach(() => {
  jest.resetAllMocks();
  builder = createQueryBuilderMock();
  mockedGetClient.mockReturnValue(builder as unknown as ReturnType<typeof getClient>);
  mockedRequireUserId.mockResolvedValue('user-1');
});

describe('listPlaces', () => {
  it('queries the places table ordered alphabetically, with no module scoping', async () => {
    builder.setResult({ data: [row], error: null });

    const result = await listPlaces();

    expect(builder.from).toHaveBeenCalledWith('places');
    expect(builder.order).toHaveBeenCalledWith('name', { ascending: true });
    expect(result[0].name).toBe('Local Roastery Café');
  });

  it('returns an empty array rather than null when there are no rows', async () => {
    builder.setResult({ data: null, error: null });

    await expect(listPlaces()).resolves.toEqual([]);
  });
});

describe('getPlace', () => {
  it('returns null when no row matches', async () => {
    builder.setResult({ data: null, error: null });

    await expect(getPlace('missing')).resolves.toBeNull();
  });
});

describe('createPlace', () => {
  it("inserts under the caller's user id", async () => {
    builder.setResult({ data: row, error: null });

    await createPlace({ name: 'Local Roastery Café', latitude: 52.52, longitude: 13.405 });

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', name: 'Local Roastery Café', latitude: 52.52, longitude: 13.405 }),
    );
  });
});

describe('updatePlace', () => {
  it('updates by id', async () => {
    builder.setResult({ data: row, error: null });

    await updatePlace('place-1', { name: 'Renamed Café' });

    expect(builder.update.mock.calls[0][0].name).toBe('Renamed Café');
    expect(builder.eq).toHaveBeenCalledWith('id', 'place-1');
  });
});

describe('deletePlace', () => {
  it('deletes by id and throws on error', async () => {
    builder.setResult({ data: null, error: { message: 'not found' } });

    await expect(deletePlace('place-1')).rejects.toEqual({ message: 'not found' });
    expect(builder.eq).toHaveBeenCalledWith('id', 'place-1');
  });
});
