import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import * as authRepo from '@/core/data/auth';
import { clearLocalCache } from '@/core/data/query-client';
import { SessionProvider, useSession } from '@/core/data/session-provider';

// Factories, so Jest never loads the real modules — both pull in client.ts
// and native AsyncStorage (see use-entries.test.tsx).
jest.mock('@/core/data/auth', () => ({
  getStoredSession: jest.fn(),
  subscribeToSession: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock('@/core/data/query-client', () => ({
  clearLocalCache: jest.fn().mockResolvedValue(undefined),
}));

const mockedGetStoredSession = authRepo.getStoredSession as jest.MockedFunction<
  typeof authRepo.getStoredSession
>;
const mockedSubscribe = authRepo.subscribeToSession as jest.MockedFunction<
  typeof authRepo.subscribeToSession
>;
const mockedSignOut = authRepo.signOut as jest.MockedFunction<typeof authRepo.signOut>;
const mockedClearLocalCache = clearLocalCache as jest.MockedFunction<typeof clearLocalCache>;

const alice = { userId: 'alice', email: 'alice@example.com' };
const bob = { userId: 'bob', email: 'bob@example.com' };

/** Captures the listener the provider registered so a test can fire auth events. */
let emit: authRepo.SessionListener;
const unsubscribe = jest.fn();

const wrapper = ({ children }: { children: ReactNode }) => (
  <SessionProvider>{children}</SessionProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  mockedSubscribe.mockImplementation((listener) => {
    emit = listener;
    return unsubscribe;
  });
  mockedSignOut.mockResolvedValue(undefined);
});

describe('SessionProvider', () => {
  it('starts restoring, then reports the session stored on the device', async () => {
    let resolveStored!: (session: authRepo.AuthSession | null) => void;
    mockedGetStoredSession.mockReturnValue(
      new Promise((resolve) => {
        resolveStored = resolve;
      }),
    );

    const { result } = await renderHook(() => useSession(), { wrapper });

    expect(result.current.status).toBe('restoring');
    await act(async () => resolveStored(alice));
    await waitFor(() => expect(result.current.status).toBe('signed-in'));
    expect(result.current.session).toEqual(alice);
    // Nothing was cached for anyone before, so there was nothing to clear.
    expect(mockedClearLocalCache).not.toHaveBeenCalled();
  });

  it('settles to signed-out when the device holds no session', async () => {
    mockedGetStoredSession.mockResolvedValue(null);

    const { result } = await renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('signed-out'));
    expect(result.current.session).toBeNull();
  });

  it('follows a session that arrives later — a sign-in link opened after launch', async () => {
    mockedGetStoredSession.mockResolvedValue(null);
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signed-out'));

    await act(async () => emit(alice));

    expect(result.current.status).toBe('signed-in');
    expect(result.current.session).toEqual(alice);
  });

  it('returns to signed-out and clears the cache when the backend drops the session', async () => {
    mockedGetStoredSession.mockResolvedValue(alice);
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signed-in'));

    await act(async () => emit(null));

    expect(result.current.status).toBe('signed-out');
    expect(mockedClearLocalCache).toHaveBeenCalledTimes(1);
  });

  it('clears the cache when a different account signs in, so nothing of the previous one shows', async () => {
    mockedGetStoredSession.mockResolvedValue(alice);
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signed-in'));

    await act(async () => emit(bob));

    expect(result.current.session).toEqual(bob);
    expect(mockedClearLocalCache).toHaveBeenCalledTimes(1);
  });

  it('does not clear the cache on a token refresh for the same account', async () => {
    mockedGetStoredSession.mockResolvedValue(alice);
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signed-in'));

    await act(async () => emit({ ...alice }));

    expect(mockedClearLocalCache).not.toHaveBeenCalled();
  });

  it('signOut ends the session on the device and clears the cache without waiting for an event', async () => {
    mockedGetStoredSession.mockResolvedValue(alice);
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signed-in'));

    await act(() => result.current.signOut());

    expect(mockedSignOut).toHaveBeenCalled();
    expect(result.current.status).toBe('signed-out');
    expect(mockedClearLocalCache).toHaveBeenCalledTimes(1);

    // The auth event for the same sign-out must not clear a second time.
    await act(async () => emit(null));
    expect(mockedClearLocalCache).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes from auth events on unmount', async () => {
    mockedGetStoredSession.mockResolvedValue(null);
    const { unmount } = await renderHook(() => useSession(), { wrapper });

    await unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});

describe('useSession', () => {
  it('throws outside a provider rather than returning a fake signed-out state', async () => {
    await expect(renderHook(() => useSession())).rejects.toThrow(/inside a SessionProvider/);
  });
});
