import { getClient } from '@/core/data/client';
import { requireUserId } from '@/core/data/session';

// Mocked so this stays a unit test: the real client.ts pulls in native
// AsyncStorage, which crashes outside a running app (see use-entries.test.tsx).
jest.mock('@/core/data/client', () => ({
  getClient: jest.fn(),
}));

const mockedGetClient = getClient as jest.MockedFunction<typeof getClient>;

/** Only the slice of SupabaseClient requireUserId actually touches. */
function clientWithSession(session: { user: { id: string } } | null) {
  return {
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session } }) },
  } as unknown as ReturnType<typeof getClient>;
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe('requireUserId', () => {
  it("resolves to the signed-in user's id", async () => {
    mockedGetClient.mockReturnValue(clientWithSession({ user: { id: 'user-1' } }));

    await expect(requireUserId()).resolves.toBe('user-1');
  });

  it('throws when there is no signed-in session, rather than returning an empty id', async () => {
    mockedGetClient.mockReturnValue(clientWithSession(null));

    await expect(requireUserId()).rejects.toThrow(/no signed-in user/i);
  });
});
