import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { getProfile, updateProfile } from '@/core/data/profiles';
import { useSession } from '@/core/data/session-provider';
import { resetRegistry } from '@/core/registry/registry';
import { ProfileScreen } from '@/shell/screens/ProfileScreen';

jest.mock('@/core/data/profiles', () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
}));
jest.mock('@/core/data/user-modules', () => ({
  listUserModules: jest.fn().mockResolvedValue([]),
  setModuleEnabled: jest.fn(),
}));
jest.mock('@/core/data/session-provider', () => ({
  useSession: jest.fn(),
}));

const mockedGetProfile = getProfile as jest.MockedFunction<typeof getProfile>;
const mockedUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;
const mockedUseSession = useSession as jest.MockedFunction<typeof useSession>;

const profile = {
  id: 'user-1',
  displayName: 'ema',
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
};

const signOut = jest.fn().mockResolvedValue(undefined);
const activeClients: QueryClient[] = [];

async function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  activeClients.push(queryClient);
  return await render(
    <QueryClientProvider client={queryClient}>
      <ProfileScreen />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  resetRegistry();
  mockedGetProfile.mockResolvedValue(profile);
  mockedUseSession.mockReturnValue({
    status: 'signed-in',
    session: { userId: 'user-1', email: 'me@example.com' },
    signOut,
  });
});

afterEach(() => {
  activeClients.splice(0).forEach((client) => client.clear());
});

describe('ProfileScreen', () => {
  it('shows the stored display name and the signed-in address', async () => {
    await renderScreen();

    await waitFor(() => expect(screen.getByLabelText('Display name').props.value).toBe('ema'));
    expect(screen.getByText('me@example.com')).toBeTruthy();
  });

  it('saves an edited name on blur', async () => {
    mockedUpdateProfile.mockResolvedValue({ ...profile, displayName: 'Ema G' });
    await renderScreen();
    await waitFor(() => expect(screen.getByLabelText('Display name').props.value).toBe('ema'));

    const input = screen.getByLabelText('Display name');
    await act(async () => fireEvent.changeText(input, 'Ema G'));
    await act(async () => fireEvent(input, 'blur'));

    await waitFor(() => expect(mockedUpdateProfile).toHaveBeenCalledWith({ displayName: 'Ema G' }));
    await waitFor(() => expect(screen.getByLabelText('Display name').props.value).toBe('Ema G'));
  });

  it('does not write when the name is unchanged or blank', async () => {
    await renderScreen();
    await waitFor(() => expect(screen.getByLabelText('Display name').props.value).toBe('ema'));

    const input = screen.getByLabelText('Display name');
    await act(async () => fireEvent(input, 'blur'));
    await act(async () => fireEvent.changeText(input, '   '));
    await act(async () => fireEvent(input, 'blur'));

    expect(mockedUpdateProfile).not.toHaveBeenCalled();
    // A blank draft is discarded, not saved, so the stored name comes back.
    expect(screen.getByLabelText('Display name').props.value).toBe('ema');
  });

  it('signs out only after the user confirms', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await renderScreen();

    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Sign out' })));

    expect(signOut).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0][2] ?? [];
    await act(async () => buttons.find((b) => b.text === 'Sign out')?.onPress?.());
    expect(signOut).toHaveBeenCalled();
  });
});
