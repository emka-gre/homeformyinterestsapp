import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { sendSignInLink } from '@/core/data';
import { SignInScreen } from '@/shell/screens/SignInScreen';

jest.mock('expo-linking', () => ({
  createURL: (path: string) => `nook://${path}`,
}));

jest.mock('@/core/data', () => ({
  isBackendConfigured: true,
  sendSignInLink: jest.fn(),
}));

const mockedSendSignInLink = sendSignInLink as jest.MockedFunction<typeof sendSignInLink>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SignInScreen', () => {
  it('keeps the button disabled until the address looks like an email', async () => {
    await render(<SignInScreen />);

    const button = screen.getByRole('button', { name: 'Send sign-in link' });
    expect(button).toBeDisabled();

    await act(async () => fireEvent.changeText(screen.getByLabelText('Email address'), 'not-an-email'));
    expect(button).toBeDisabled();

    await act(async () => fireEvent.changeText(screen.getByLabelText('Email address'), 'me@example.com'));
    expect(button).toBeEnabled();
  });

  it("asks for a link to this build's callback route and then says to check email", async () => {
    mockedSendSignInLink.mockResolvedValue(undefined);
    await render(<SignInScreen />);

    await act(async () => fireEvent.changeText(screen.getByLabelText('Email address'), 'me@example.com'));
    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Send sign-in link' })));

    expect(mockedSendSignInLink).toHaveBeenCalledWith('me@example.com', 'nook://auth/callback');
    await waitFor(() => expect(screen.getByText('Check your email')).toBeTruthy());
    expect(screen.getByText(/me@example\.com/)).toBeTruthy();
  });

  it('shows the failure and lets the user try again', async () => {
    mockedSendSignInLink.mockRejectedValue(new Error('Email rate limit exceeded'));
    await render(<SignInScreen />);

    await act(async () => fireEvent.changeText(screen.getByLabelText('Email address'), 'me@example.com'));
    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Send sign-in link' })));

    await waitFor(() => expect(screen.getByText('Email rate limit exceeded')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Send sign-in link' })).toBeEnabled();
  });

  it('carries over the reason it was reached, so an expired link reads as a continuation', async () => {
    await render(<SignInScreen initialNotice="That sign-in link has expired." />);

    expect(screen.getByText('That sign-in link has expired.')).toBeTruthy();
  });
});
