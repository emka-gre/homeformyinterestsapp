import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  getStoredSession,
  signOut as signOutOnDevice,
  subscribeToSession,
  type AuthSession,
} from '@/core/data/auth';
import { clearLocalCache } from '@/core/data/query-client';

/**
 * `restoring` lasts from launch until the device has said whether it holds a
 * session (task 6.2). Routing waits on it so a signed-in user never glimpses
 * the sign-in screen, and a signed-out one never glimpses the timeline.
 */
export type SessionStatus = 'restoring' | 'signed-in' | 'signed-out';

export interface SessionState {
  status: SessionStatus;
  session: AuthSession | null;
  /** Ends the session on this device and clears everything cached for it. */
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

/**
 * Owns the answer to "who is signed in?" for the whole app. Every screen
 * reads it through {@link useSession}; nothing else subscribes to auth
 * events, so the cache-clearing rule below lives in exactly one place.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('restoring');
  const [session, setSession] = useState<AuthSession | null>(null);

  const apply = useCallback((next: AuthSession | null) => {
    setSession(next);
    setStatus(next ? 'signed-in' : 'signed-out');
  }, []);

  useEffect(() => {
    let active = true;
    const guarded = (next: AuthSession | null) => {
      if (active) apply(next);
    };

    // The subscription reports every later change; the direct read answers
    // for launch, and is what settles `restoring` when the backend is not
    // configured and no event will ever arrive.
    const unsubscribe = subscribeToSession(guarded);
    void getStoredSession().then(guarded);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [apply]);

  // The user the cache currently belongs to, or null. Whenever that changes
  // — the session ended, or a different account signed in — whatever is
  // cached belongs to someone who is no longer here (user-account: "Sign
  // out", "Session no longer valid").
  //
  // This is an effect rather than part of `apply` on purpose: when the
  // session ends, the in-app screens unmount in the same commit the status
  // change lands in, and a parent's effect runs after its children's
  // cleanup. Clearing inline would run while those screens' queries are
  // still observed, and an observed query refetches the moment it is
  // removed — the cache would be repopulated before the clear finished.
  const cachedForUser = useRef<string | null>(null);
  const userId = session?.userId ?? null;
  useEffect(() => {
    if (status === 'restoring') return;
    const previous = cachedForUser.current;
    cachedForUser.current = userId;
    if (previous !== null && previous !== userId) {
      void clearLocalCache();
    }
  }, [status, userId]);

  const signOut = useCallback(async () => {
    await signOutOnDevice();
    // The auth listener reports the same change, but only once the event
    // arrives; applying here as well makes sign-out synchronous from the
    // caller's point of view.
    apply(null);
  }, [apply]);

  const value = useMemo<SessionState>(
    () => ({ status, session, signOut }),
    [status, session, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used inside a SessionProvider.');
  }
  return value;
}
