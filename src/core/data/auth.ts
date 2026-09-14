import type { Session } from '@supabase/supabase-js';

import { getClient, isBackendConfigured } from '@/core/data/client';

/**
 * The repository layer for authentication (tasks 6.1–6.3). Like every other
 * file in core/data this is the only place the auth client is touched; the
 * sign-in screen and the session provider call these and never the client
 * (design D10).
 *
 * Sign-in is passwordless: the user gives an email address, receives a
 * single-use link, and opening it establishes a session (user-account:
 * "Account creation", "Sign in").
 */

/** The slice of a session the rest of the app is allowed to care about. */
export interface AuthSession {
  userId: string;
  email: string | null;
}

/**
 * Emitted by {@link subscribeToSession}. `null` means signed out — either
 * explicitly or because a stored session could no longer be refreshed
 * (user-account: "Session no longer valid").
 */
export type SessionListener = (session: AuthSession | null) => void;

function toAuthSession(session: Session | null): AuthSession | null {
  if (!session) return null;
  return { userId: session.user.id, email: session.user.email ?? null };
}

/**
 * Sends a sign-in link to `email`, creating the account if none exists. The
 * backend deliberately responds the same way in both cases, so this cannot
 * tell the caller whether the address was already registered (user-account:
 * "Email already registered").
 *
 * `redirectTo` is where the link lands after the auth server verifies it —
 * the app's own callback route, on whichever platform the request came from.
 * It has to be on the backend's allow-list (supabase/config.toml
 * `additional_redirect_urls` locally; the dashboard for the hosted project).
 */
export async function sendSignInLink(email: string, redirectTo: string): Promise<void> {
  const { error } = await getClient().auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
  });
  if (error) throw error;
}

/**
 * The parameters a sign-in link carries when it opens the app. The auth
 * server puts them in the URL fragment (`#access_token=…`) for the implicit
 * flow, and in the query (`?code=…`) for PKCE; a failed verification comes
 * back as `error_description` in either place.
 */
export interface AuthCallbackParams {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  errorDescription?: string;
}

/**
 * Pulls the auth parameters out of a callback URL. Pure, so the two shapes
 * (fragment and query) are unit-tested without a client.
 */
export function parseAuthCallbackUrl(url: string): AuthCallbackParams {
  const params = new URLSearchParams();

  // Custom-scheme URLs (nook://auth/callback#…) don't always parse as a
  // standard URL, so split by hand rather than trusting the URL constructor.
  const [beforeHash, fragment] = url.split('#', 2);
  const query = beforeHash.split('?', 2)[1];

  for (const part of [query, fragment]) {
    if (!part) continue;
    new URLSearchParams(part).forEach((value, key) => params.set(key, value));
  }

  return {
    accessToken: params.get('access_token') ?? undefined,
    refreshToken: params.get('refresh_token') ?? undefined,
    code: params.get('code') ?? undefined,
    errorDescription: params.get('error_description') ?? undefined,
  };
}

/**
 * Turns an opened sign-in link into a session. Throws when the link has
 * expired or already been used — the auth server refuses those, and so must
 * we (user-account: "Expired or reused link").
 */
export async function completeSignIn(url: string): Promise<AuthSession> {
  const params = parseAuthCallbackUrl(url);
  const auth = getClient().auth;

  if (params.errorDescription) {
    throw new Error(params.errorDescription);
  }

  if (params.code) {
    const { data, error } = await auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return toAuthSession(data.session)!;
  }

  if (params.accessToken && params.refreshToken) {
    const { data, error } = await auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
    });
    if (error) throw error;
    if (!data.session) throw new Error('The sign-in link did not produce a session.');
    return toAuthSession(data.session)!;
  }

  throw new Error('This link is not a valid sign-in link.');
}

/** The session stored on this device, if any — no network round trip. */
export async function getStoredSession(): Promise<AuthSession | null> {
  if (!isBackendConfigured) return null;
  const {
    data: { session },
  } = await getClient().auth.getSession();
  return toAuthSession(session);
}

/**
 * Notifies `listener` whenever the session changes: restored on launch,
 * established by a link, refreshed, or ended (by sign-out or because the
 * backend rejected a stale refresh token). Returns an unsubscribe function.
 */
export function subscribeToSession(listener: SessionListener): () => void {
  if (!isBackendConfigured) return () => {};
  const {
    data: { subscription },
  } = getClient().auth.onAuthStateChange((_event, session) => {
    listener(toAuthSession(session));
  });
  return () => subscription.unsubscribe();
}

/**
 * Ends the session on this device. Clearing the local cache is the session
 * provider's job (it owns the query client), and it does so on the
 * signed-out notification rather than here — that way a session that
 * expires on its own clears the cache by the same path (task 6.3).
 */
export async function signOut(): Promise<void> {
  // `local` drops the session on this device only, without a round trip —
  // so sign-out also works offline, and other devices stay signed in
  // (user-account: "end their session on the current device").
  const { error } = await getClient().auth.signOut({ scope: 'local' });
  if (error) throw error;
}
