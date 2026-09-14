import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Linking from 'expo-linking';

import { completeSignIn, useSession } from '@/core/data';
import { AuthCallbackScreen } from '@/shell/screens/AuthCallbackScreen';

const mockReplace = jest.fn();
// One object for the whole test, as the real hook returns — the screen's
// effect depends on the router, so a fresh object per render would loop it.
const mockRouter = { replace: mockReplace, navigate: jest.fn(), push: jest.fn() };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('expo-linking', () => ({
  useURL: jest.fn(),
}));

jest.mock('@/core/data', () => ({
  completeSignIn: jest.fn(),
  useSession: jest.fn(),
}));

const mockedUseURL = Linking.useURL as jest.MockedFunction<typeof Linking.useURL>;
const mockedCompleteSignIn = completeSignIn as jest.MockedFunction<typeof completeSignIn>;
const mockedUseSession = useSession as jest.MockedFunction<typeof useSession>;

function sessionStatus(status: 'signed-in' | 'signed-out') {
  mockedUseSession.mockReturnValue({
    status,
    session: status === 'signed-in' ? { userId: 'user-1', email: null } : null,
    signOut: jest.fn(),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  sessionStatus('signed-out');
});

describe('AuthCallbackScreen', () => {
  it('waits for the opening URL before doing anything', async () => {
    mockedUseURL.mockReturnValue(null);

    await render(<AuthCallbackScreen />);

    expect(screen.getByText('Signing you in…')).toBeTruthy();
    expect(mockedCompleteSignIn).not.toHaveBeenCalled();
  });

  it('hands the full URL to the auth layer and lands on the timeline', async () => {
    mockedUseURL.mockReturnValue('nook://auth/callback#access_token=at&refresh_token=rt');
    mockedCompleteSignIn.mockResolvedValue({ userId: 'user-1', email: null });

    await render(<AuthCallbackScreen />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
    expect(mockedCompleteSignIn).toHaveBeenCalledWith(
      'nook://auth/callback#access_token=at&refresh_token=rt',
    );
  });

  it('refuses a dead link and offers a new one instead of a session', async () => {
    mockedUseURL.mockReturnValue('nook://auth/callback#error_description=Email+link+is+invalid');
    mockedCompleteSignIn.mockRejectedValue(new Error('Email link is invalid'));

    await render(<AuthCallbackScreen />);

    await waitFor(() => expect(screen.getByText("That link didn't work")).toBeTruthy());
    expect(screen.getByText('Email link is invalid')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalledWith('/');

    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Send a new link' })));

    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/sign-in', params: expect.objectContaining({ notice: expect.any(String) }) }),
    );
  });

  it('carries on to the timeline when a dead link is opened by someone already signed in', async () => {
    sessionStatus('signed-in');
    mockedUseURL.mockReturnValue('nook://auth/callback#error_description=Email+link+is+invalid');
    mockedCompleteSignIn.mockRejectedValue(new Error('Email link is invalid'));

    await render(<AuthCallbackScreen />);

    await waitFor(() => expect(screen.getByText("You're already signed in")).toBeTruthy());
    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Continue' })));

    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
