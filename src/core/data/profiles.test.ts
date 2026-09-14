import { getClient } from '@/core/data/client';
import { getProfile, updateProfile } from '@/core/data/profiles';
import { requireUserId } from '@/core/data/session';
import {
  createQueryBuilderMock,
  type QueryBuilderMock,
} from '@/core/data/test-helpers/query-builder-mock';

// Mocked so this stays a unit test — see entries.test.ts for why.
jest.mock('@/core/data/client', () => ({ getClient: jest.fn() }));
jest.mock('@/core/data/session', () => ({ requireUserId: jest.fn() }));

const mockedGetClient = getClient as jest.MockedFunction<typeof getClient>;
const mockedRequireUserId = requireUserId as jest.MockedFunction<typeof requireUserId>;

const row = {
  id: 'user-1',
  display_name: 'ema',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

let builder: QueryBuilderMock;

beforeEach(() => {
  jest.resetAllMocks();
  builder = createQueryBuilderMock();
  mockedGetClient.mockReturnValue(builder as unknown as ReturnType<typeof getClient>);
  mockedRequireUserId.mockResolvedValue('user-1');
});

describe('getProfile', () => {
  it("reads the single row RLS exposes and maps it to the app's shape", async () => {
    builder.setResult({ data: row, error: null });

    await expect(getProfile()).resolves.toEqual({
      id: 'user-1',
      displayName: 'ema',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
    expect(builder.from).toHaveBeenCalledWith('profiles');
    expect(builder.single).toHaveBeenCalled();
  });

  it('throws when there is no row — the trigger guarantees one, so its absence is a real error', async () => {
    builder.setResult({ data: null, error: { message: 'JSON object requested, multiple (or no) rows returned' } });

    await expect(getProfile()).rejects.toMatchObject({ message: expect.stringMatching(/no\) rows/) });
  });
});

describe('updateProfile', () => {
  it("writes the trimmed name against the caller's own id", async () => {
    builder.setResult({ data: { ...row, display_name: 'Ema G' }, error: null });

    const result = await updateProfile({ displayName: '  Ema G  ' });

    expect(builder.update).toHaveBeenCalledWith({ display_name: 'Ema G' });
    expect(builder.eq).toHaveBeenCalledWith('id', 'user-1');
    expect(result.displayName).toBe('Ema G');
  });

  it('throws the Postgrest error instead of swallowing it', async () => {
    builder.setResult({ data: null, error: { message: 'permission denied' } });

    await expect(updateProfile({ displayName: 'x' })).rejects.toEqual({ message: 'permission denied' });
  });
});
