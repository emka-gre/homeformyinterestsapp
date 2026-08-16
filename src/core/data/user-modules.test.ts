import { getClient } from '@/core/data/client';
import { requireUserId } from '@/core/data/session';
import {
  createQueryBuilderMock,
  type QueryBuilderMock,
} from '@/core/data/test-helpers/query-builder-mock';
import { listUserModules, setModuleEnabled } from '@/core/data/user-modules';

// Mocked so this stays a unit test — see entries.test.ts for why.
jest.mock('@/core/data/client', () => ({ getClient: jest.fn() }));
jest.mock('@/core/data/session', () => ({ requireUserId: jest.fn() }));

const mockedGetClient = getClient as jest.MockedFunction<typeof getClient>;
const mockedRequireUserId = requireUserId as jest.MockedFunction<typeof requireUserId>;

let builder: QueryBuilderMock;

beforeEach(() => {
  jest.resetAllMocks();
  builder = createQueryBuilderMock();
  mockedGetClient.mockReturnValue(builder as unknown as ReturnType<typeof getClient>);
  mockedRequireUserId.mockResolvedValue('user-1');
});

describe('listUserModules', () => {
  it('reads the enablement rows in stored order', async () => {
    builder.setResult({
      data: [
        { user_id: 'user-1', module_id: 'coffee', enabled: true, position: 0 },
        { user_id: 'user-1', module_id: 'sports', enabled: false, position: 1 },
      ],
      error: null,
    });

    const result = await listUserModules();

    expect(builder.from).toHaveBeenCalledWith('user_modules');
    expect(builder.order).toHaveBeenCalledWith('position', { ascending: true });
    expect(result).toEqual([
      { moduleId: 'coffee', enabled: true, position: 0 },
      { moduleId: 'sports', enabled: false, position: 1 },
    ]);
  });

  it('returns an empty array when the user has never toggled a module', async () => {
    builder.setResult({ data: null, error: null });

    await expect(listUserModules()).resolves.toEqual([]);
  });

  it('throws the Postgrest error instead of swallowing it', async () => {
    builder.setResult({ data: null, error: { message: 'connection reset' } });

    await expect(listUserModules()).rejects.toEqual({ message: 'connection reset' });
  });
});

describe('setModuleEnabled', () => {
  it("upserts under the caller's user id, keyed so a repeated toggle overwrites", async () => {
    builder.setResult({
      data: { user_id: 'user-1', module_id: 'coffee', enabled: true, position: 0 },
      error: null,
    });

    await setModuleEnabled('coffee', true);

    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', module_id: 'coffee', enabled: true }),
      { onConflict: 'user_id,module_id' },
    );
  });

  it('disables by writing enabled: false, never by deleting the row', async () => {
    builder.setResult({
      data: { user_id: 'user-1', module_id: 'coffee', enabled: false, position: 0 },
      error: null,
    });

    const result = await setModuleEnabled('coffee', false);

    expect(builder.delete).not.toHaveBeenCalled();
    expect(builder.upsert.mock.calls[0][0].enabled).toBe(false);
    expect(result.enabled).toBe(false);
  });
});
