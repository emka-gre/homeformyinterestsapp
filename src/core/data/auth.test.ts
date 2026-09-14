import {
  completeSignIn,
  parseAuthCallbackUrl,
  sendSignInLink,
  signOut,
  subscribeToSession,
} from '@/core/data/auth';
import { getClient, isBackendConfigured } from '@/core/data/client';

// Mocked so this stays a unit test — see entries.test.ts for why.
jest.mock('@/core/data/client', () => ({ getClient: jest.fn(), isBackendConfigured: true }));

const mockedGetClient = getClient as jest.MockedFunction<typeof getClient>;

/** Only the slice of the auth client these functions touch. */
function makeAuth() {
  return {
    signInWithOtp: jest.fn().mockResolvedValue({ data: {}, error: null }),
    exchangeCodeForSession: jest.fn(),
    setSession: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  };
}

let auth: ReturnType<typeof makeAuth>;

beforeEach(() => {
  jest.resetAllMocks();
  auth = makeAuth();
  mockedGetClient.mockReturnValue({ auth } as unknown as ReturnType<typeof getClient>);
});

describe('parseAuthCallbackUrl', () => {
  it('reads tokens from the fragment, which is where the implicit flow puts them', () => {
    expect(
      parseAuthCallbackUrl('nook://auth/callback#access_token=at&refresh_token=rt&type=magiclink'),
    ).toMatchObject({ accessToken: 'at', refreshToken: 'rt' });
  });

  it('reads the PKCE code from the query', () => {
    expect(parseAuthCallbackUrl('http://localhost:8081/auth/callback?code=abc')).toMatchObject({
      code: 'abc',
      accessToken: undefined,
    });
  });

  it('surfaces the error the auth server sends for a dead link', () => {
    expect(
      parseAuthCallbackUrl(
        'nook://auth/callback#error=access_denied&error_description=Email+link+is+invalid+or+has+expired',
      ).errorDescription,
    ).toBe('Email link is invalid or has expired');
  });

  it('returns nothing for a URL carrying no auth parameters', () => {
    expect(parseAuthCallbackUrl('nook://auth/callback')).toEqual({
      accessToken: undefined,
      refreshToken: undefined,
      code: undefined,
      errorDescription: undefined,
    });
  });
});

describe('sendSignInLink', () => {
  it('asks for a link to the trimmed address, creating the account if needed', async () => {
    await sendSignInLink('  me@example.com ', 'nook://auth/callback');

    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'me@example.com',
      options: { emailRedirectTo: 'nook://auth/callback', shouldCreateUser: true },
    });
  });

  it('throws the auth error instead of swallowing it', async () => {
    auth.signInWithOtp.mockResolvedValue({ data: {}, error: new Error('rate limited') });

    await expect(sendSignInLink('me@example.com', 'nook://auth/callback')).rejects.toThrow(
      'rate limited',
    );
  });
});

describe('completeSignIn', () => {
  const session = { user: { id: 'user-1', email: 'me@example.com' } };

  it('establishes a session from fragment tokens', async () => {
    auth.setSession.mockResolvedValue({ data: { session }, error: null });

    await expect(
      completeSignIn('nook://auth/callback#access_token=at&refresh_token=rt'),
    ).resolves.toEqual({ userId: 'user-1', email: 'me@example.com' });
    expect(auth.setSession).toHaveBeenCalledWith({ access_token: 'at', refresh_token: 'rt' });
  });

  it('exchanges a PKCE code', async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ data: { session }, error: null });

    await expect(completeSignIn('nook://auth/callback?code=abc')).resolves.toMatchObject({
      userId: 'user-1',
    });
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('abc');
  });

  it('refuses a link the auth server already rejected, without touching the client', async () => {
    await expect(
      completeSignIn('nook://auth/callback#error_description=Email+link+is+invalid+or+has+expired'),
    ).rejects.toThrow(/invalid or has expired/);
    expect(auth.setSession).not.toHaveBeenCalled();
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('refuses a URL with no auth parameters at all', async () => {
    await expect(completeSignIn('nook://auth/callback')).rejects.toThrow(/not a valid sign-in link/);
  });

  it('propagates a rejected token exchange, so a reused link never yields a session', async () => {
    auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: new Error('invalid flow state'),
    });

    await expect(completeSignIn('nook://auth/callback?code=used')).rejects.toThrow(
      'invalid flow state',
    );
  });
});

describe('subscribeToSession', () => {
  it('reports each auth change as the app-facing session shape, and unsubscribes cleanly', () => {
    const unsubscribe = jest.fn();
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
    const listener = jest.fn();

    const stop = subscribeToSession(listener);
    const callback = auth.onAuthStateChange.mock.calls[0][0];
    callback('SIGNED_IN', { user: { id: 'user-1', email: 'me@example.com' } });
    callback('SIGNED_OUT', null);
    stop();

    expect(listener).toHaveBeenNthCalledWith(1, { userId: 'user-1', email: 'me@example.com' });
    expect(listener).toHaveBeenNthCalledWith(2, null);
    expect(unsubscribe).toHaveBeenCalled();
    expect(isBackendConfigured).toBe(true);
  });
});

describe('signOut', () => {
  it('ends the session on this device only, so it works offline and leaves other devices alone', async () => {
    await signOut();

    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});
