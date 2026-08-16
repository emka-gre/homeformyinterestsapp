import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { z } from 'zod';

import { queryKeys } from '@/core/data/query-keys';
import * as userModulesRepo from '@/core/data/user-modules';
import { useEnabledModules, useSetModuleEnabled } from '@/core/data/use-user-modules';
import { registerModule, resetRegistry } from '@/core/registry/registry';
import type { ModuleManifest } from '@/core/registry/types';

// A factory keeps Jest from requiring the real user-modules.ts to build an
// automock — that chain pulls in client.ts and native AsyncStorage.
jest.mock('@/core/data/user-modules', () => ({
  listUserModules: jest.fn(),
  setModuleEnabled: jest.fn(),
}));

const mockedListUserModules = userModulesRepo.listUserModules as jest.MockedFunction<
  typeof userModulesRepo.listUserModules
>;
const mockedSetModuleEnabled = userModulesRepo.setModuleEnabled as jest.MockedFunction<
  typeof userModulesRepo.setModuleEnabled
>;

function makeManifest(id: string): ModuleManifest {
  return {
    id,
    name: id,
    icon: 'circle',
    color: '#000000',
    entryTypes: [{ id: `${id}-entry`, label: id, schema: z.object({}) }],
    itemTypes: [],
    FeedCard: () => null,
    usesPlaces: false,
  };
}

const activeClients: QueryClient[] = [];

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  activeClients.push(queryClient);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

beforeEach(() => {
  jest.resetAllMocks();
  resetRegistry();
});

afterEach(() => {
  activeClients.splice(0).forEach((client) => client.clear());
  resetRegistry();
});

describe('useEnabledModules', () => {
  it('returns only the modules with an enabled row, in stored position order', async () => {
    registerModule(makeManifest('coffee'));
    registerModule(makeManifest('sports'));
    registerModule(makeManifest('books'));
    mockedListUserModules.mockResolvedValue([
      { moduleId: 'sports', enabled: true, position: 0 },
      { moduleId: 'coffee', enabled: true, position: 1 },
      { moduleId: 'books', enabled: false, position: 2 },
    ]);

    const { wrapper } = makeWrapper();
    const { result } = await renderHook(() => useEnabledModules(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.modules.map((manifest) => manifest.id)).toEqual(['sports', 'coffee']);
  });

  it('treats a module with no row as disabled, so a newly shipped module stays opt-in', async () => {
    registerModule(makeManifest('coffee'));
    mockedListUserModules.mockResolvedValue([]);

    const { wrapper } = makeWrapper();
    const { result } = await renderHook(() => useEnabledModules(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.modules).toEqual([]);
  });

  it('ignores an enablement row whose module is not in this build, rather than crashing nav', async () => {
    registerModule(makeManifest('coffee'));
    mockedListUserModules.mockResolvedValue([
      { moduleId: 'coffee', enabled: true, position: 0 },
      { moduleId: 'removed-module', enabled: true, position: 1 },
    ]);

    const { wrapper } = makeWrapper();
    const { result } = await renderHook(() => useEnabledModules(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.modules.map((manifest) => manifest.id)).toEqual(['coffee']);
  });
});

describe('useSetModuleEnabled', () => {
  it('adds an optimistic row on the first toggle of a module', async () => {
    registerModule(makeManifest('coffee'));
    mockedListUserModules.mockResolvedValue([]);
    let resolveWrite!: (value: userModulesRepo.UserModule) => void;
    mockedSetModuleEnabled.mockReturnValue(
      new Promise((resolve) => {
        resolveWrite = resolve;
      }),
    );

    const { queryClient, wrapper } = makeWrapper();
    const { result: enabled } = await renderHook(() => useEnabledModules(), { wrapper });
    await waitFor(() => expect(enabled.current.isLoading).toBe(false));

    const { result: mutation } = await renderHook(() => useSetModuleEnabled(), { wrapper });
    mutation.current.mutate({ moduleId: 'coffee', enabled: true });

    // The nav entry appears before the write lands.
    await waitFor(() =>
      expect(
        queryClient.getQueryData<userModulesRepo.UserModule[]>(queryKeys.userModules.list()),
      ).toEqual([{ moduleId: 'coffee', enabled: true, position: 0 }]),
    );

    mockedListUserModules.mockResolvedValue([{ moduleId: 'coffee', enabled: true, position: 0 }]);
    resolveWrite({ moduleId: 'coffee', enabled: true, position: 0 });
    await waitFor(() => expect(mutation.current.isSuccess).toBe(true));
  });

  it('rolls back the toggle when the write fails', async () => {
    registerModule(makeManifest('coffee'));
    const stored = [{ moduleId: 'coffee', enabled: true, position: 0 }];
    mockedListUserModules.mockResolvedValue(stored);
    mockedSetModuleEnabled.mockRejectedValue(new Error('network down'));

    const { queryClient, wrapper } = makeWrapper();
    const { result: enabled } = await renderHook(() => useEnabledModules(), { wrapper });
    await waitFor(() => expect(enabled.current.isLoading).toBe(false));

    const { result: mutation } = await renderHook(() => useSetModuleEnabled(), { wrapper });
    mutation.current.mutate({ moduleId: 'coffee', enabled: false });

    await waitFor(() => expect(mutation.current.isError).toBe(true));
    expect(
      queryClient.getQueryData<userModulesRepo.UserModule[]>(queryKeys.userModules.list()),
    ).toEqual(stored);
  });
});
