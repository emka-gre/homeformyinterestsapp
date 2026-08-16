import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { z } from 'zod';

import { queryKeys } from '@/core/data/query-keys';
import { listUserModules } from '@/core/data/user-modules';
import { registerModule, resetRegistry } from '@/core/registry/registry';
import type { ModuleManifest } from '@/core/registry/types';
import { CaptureButton } from '@/shell/capture/CaptureButton';
import { NavBar } from '@/shell/navigation/NavBar';
import { ModuleHomeScreen } from '@/shell/screens/ModuleHomeScreen';
import { ModuleRouteScreen } from '@/shell/screens/ModuleRouteScreen';

/**
 * Task 5.4: registering a module must add navigation, capture options, and
 * routes with **zero shell edits**. This test is that check, kept permanently
 * rather than done once by hand — it registers a module the shell has never
 * heard of and asserts the shell surfaces it.
 *
 * If someone later writes `if (moduleId === 'coffee')` in the shell, this
 * test keeps passing but the grep in ModuleHomeScreen's siblings fails; the
 * two together are the guard.
 */

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn(), push: jest.fn() }),
  usePathname: () => '/',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/core/data/user-modules', () => ({
  listUserModules: jest.fn(),
  setModuleEnabled: jest.fn(),
}));

const mockedListUserModules = listUserModules as jest.MockedFunction<typeof listUserModules>;

/** A module invented purely for this test — nothing in src/shell/ knows this id exists. */
const dummyModule: ModuleManifest = {
  id: 'stargazing',
  name: 'Stargazing',
  icon: '🔭',
  color: '#4c6ef5',
  entryTypes: [
    { id: 'observation', label: 'Observation', schema: z.object({ object: z.string() }) },
    { id: 'session', label: 'Session', schema: z.object({}) },
  ],
  itemTypes: [],
  FeedCard: () => null,
  usesPlaces: true,
  routes: [{ path: 'log', label: 'Observation log', Screen: () => <Text>Dummy log screen</Text> }],
};

const activeClients: QueryClient[] = [];

async function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  activeClients.push(queryClient);
  // Seed the enablement cache directly so the render is synchronous.
  queryClient.setQueryData(queryKeys.userModules.list(), [
    { moduleId: 'stargazing', enabled: true, position: 0 },
  ]);
  return await render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  jest.clearAllMocks();
  resetRegistry();
  mockedListUserModules.mockResolvedValue([
    { moduleId: 'stargazing', enabled: true, position: 0 },
  ]);
  registerModule(dummyModule);
});

afterEach(() => {
  activeClients.splice(0).forEach((client) => client.clear());
  resetRegistry();
});

describe('registering a module wires up the shell without shell edits', () => {
  it('adds a navigation entry between the fixed Timeline and Profile ones', async () => {
    await renderWithProviders(<NavBar />);

    expect(await screen.findByLabelText('Stargazing')).toBeTruthy();
    expect(screen.getByLabelText('Timeline')).toBeTruthy();
    expect(screen.getByLabelText('Profile')).toBeTruthy();
  });

  it('adds one capture option per declared entry type', async () => {
    await renderWithProviders(<CaptureButton />);

    const button = await screen.findByLabelText('Log something');
    expect(button).toBeTruthy();

    await fireEvent.press(button);

    // Two entry types → a menu, one option each, labelled by module and type.
    expect(await screen.findByLabelText('Stargazing — Observation')).toBeTruthy();
    expect(screen.getByLabelText('Stargazing — Session')).toBeTruthy();
  });

  it('renders the module home screen from the manifest alone', async () => {
    await renderWithProviders(<ModuleHomeScreen moduleId="stargazing" />);

    expect(screen.getByText('Stargazing')).toBeTruthy();
    // Declared routes are listed without the shell knowing what they are.
    expect(screen.getByText('Observation log')).toBeTruthy();
  });

  it('resolves a module-declared route to that module’s own screen', async () => {
    await renderWithProviders(<ModuleRouteScreen moduleId="stargazing" path="log" />);

    expect(screen.getByText('Dummy log screen')).toBeTruthy();
  });

  it('shows a dead end rather than crashing on an unresolvable module', async () => {
    await renderWithProviders(<ModuleHomeScreen moduleId="never-registered" />);

    expect(screen.getByText('Not found')).toBeTruthy();
  });
});
