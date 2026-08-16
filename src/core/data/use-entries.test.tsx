import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import * as entriesRepo from '@/core/data/entries';
import { useCreateEntry, useDeleteEntry, useEntries } from '@/core/data/use-entries';
import { queryKeys } from '@/core/data/query-keys';
import type { Entry } from '@/core/types/domain';

// A factory keeps Jest from requiring the real entries.ts to build an
// automock — that module chain pulls in client.ts, which touches native
// AsyncStorage and crashes outside a running app. jest.mock calls are
// hoisted above these imports by the babel-jest transform regardless of
// where they appear in the file.
jest.mock('@/core/data/entries', () => ({
  listEntries: jest.fn(),
  createEntry: jest.fn(),
  deleteEntry: jest.fn(),
  updateEntry: jest.fn(),
  getEntry: jest.fn(),
}));

const mockedListEntries = entriesRepo.listEntries as jest.MockedFunction<
  typeof entriesRepo.listEntries
>;
const mockedCreateEntry = entriesRepo.createEntry as jest.MockedFunction<
  typeof entriesRepo.createEntry
>;
const mockedDeleteEntry = entriesRepo.deleteEntry as jest.MockedFunction<
  typeof entriesRepo.deleteEntry
>;

const existingEntry: Entry = {
  id: 'entry-1',
  userId: 'user-1',
  moduleId: 'coffee',
  entryType: 'brew',
  occurredAt: '2026-08-16T09:00:00.000Z',
  status: 'done',
  visibility: 'private',
  rating: 4,
  notes: null,
  tags: [],
  itemId: null,
  placeId: null,
  payload: {},
  createdAt: '2026-08-16T09:00:00.000Z',
  updatedAt: '2026-08-16T09:00:00.000Z',
};

const activeClients: QueryClient[] = [];

function makeWrapper() {
  // gcTime: 0 so no query lingers past the test on a real setTimeout — left
  // at its multi-minute default, Jest waits it out before the process exits.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  activeClients.push(queryClient);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

afterEach(() => {
  activeClients.splice(0).forEach((client) => client.clear());
});

/** A promise the test controls the resolution of, so it can inspect the optimistic cache state before the mutation settles and the ensuing invalidation refetch overwrites it. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe('useCreateEntry', () => {
  it('adds an optimistic entry to the cached list immediately, then reconciles once the write settles', async () => {
    mockedListEntries.mockResolvedValue([existingEntry]);
    const created: Entry = { ...existingEntry, id: 'entry-2', notes: 'Real row from the server' };
    const write = deferred<Entry>();
    mockedCreateEntry.mockReturnValue(write.promise);

    const { queryClient, wrapper } = makeWrapper();
    const { result: list } = await renderHook(() => useEntries(), { wrapper });
    await waitFor(() => expect(list.current.isSuccess).toBe(true));

    const { result: mutation } = await renderHook(() => useCreateEntry(), { wrapper });
    mutation.current.mutate({ moduleId: 'coffee', entryType: 'brew', payload: {} });

    // Optimistic row appears before the write resolves.
    await waitFor(() => {
      const cached = queryClient.getQueryData<Entry[]>(queryKeys.entries.list());
      expect(cached).toHaveLength(2);
    });

    // Now let the write settle — onSettled refetches the list with the real row.
    mockedListEntries.mockResolvedValue([existingEntry, created]);
    write.resolve(created);
    await waitFor(() => expect(mutation.current.isSuccess).toBe(true));
    await waitFor(() => {
      const cached = queryClient.getQueryData<Entry[]>(queryKeys.entries.list());
      expect(cached?.map((entry) => entry.id)).toEqual(['entry-1', 'entry-2']);
    });
  });

  it('rolls back the optimistic entry when the write fails', async () => {
    mockedListEntries.mockResolvedValue([existingEntry]);
    mockedCreateEntry.mockRejectedValue(new Error('network down'));

    const { queryClient, wrapper } = makeWrapper();
    const { result: list } = await renderHook(() => useEntries(), { wrapper });
    await waitFor(() => expect(list.current.isSuccess).toBe(true));

    const { result: mutation } = await renderHook(() => useCreateEntry(), { wrapper });
    mutation.current.mutate({ moduleId: 'coffee', entryType: 'brew', payload: {} });

    await waitFor(() => expect(mutation.current.isError).toBe(true));

    const cached = queryClient.getQueryData<Entry[]>(queryKeys.entries.list());
    expect(cached).toEqual([existingEntry]);
  });
});

describe('useDeleteEntry', () => {
  it('removes the entry from the cached list immediately, before the write settles', async () => {
    mockedListEntries.mockResolvedValue([existingEntry]);
    const write = deferred<void>();
    mockedDeleteEntry.mockReturnValue(write.promise);

    const { queryClient, wrapper } = makeWrapper();
    const { result: list } = await renderHook(() => useEntries(), { wrapper });
    await waitFor(() => expect(list.current.isSuccess).toBe(true));

    const { result: mutation } = await renderHook(() => useDeleteEntry(), { wrapper });
    mutation.current.mutate('entry-1');

    await waitFor(() => {
      const cached = queryClient.getQueryData<Entry[]>(queryKeys.entries.list());
      expect(cached).toEqual([]);
    });

    mockedListEntries.mockResolvedValue([]);
    write.resolve();
    await waitFor(() => expect(mutation.current.isSuccess).toBe(true));
  });
});
