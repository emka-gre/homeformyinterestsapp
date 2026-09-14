import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';

/** How long a restored cache stays useful before it is discarded. */
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // one week

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      // The cache is persisted, so entries logged on a previous run should
      // still be on screen before the network answers.
      gcTime: CACHE_MAX_AGE,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Logging an entry must not depend on connectivity (design D10).
      retry: 3,
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'nook-query-cache',
});

export const persistOptions = {
  persister,
  maxAge: CACHE_MAX_AGE,
};

/**
 * Drops everything cached on this device — in memory and in the persisted
 * copy — so that after sign-out, or once a stored session turns out to be
 * dead, nothing of the previous account remains to be shown (task 6.3;
 * user-account: "Sign out", "Session no longer valid").
 */
export async function clearLocalCache(): Promise<void> {
  queryClient.clear();
  await persister.removeClient();
}
