import { getClient } from '@/core/data/client';

/**
 * The signed-in user's id, read from the local session (no network round
 * trip). Every write goes through here rather than asking the caller to pass
 * a user id — RLS requires `user_id` to equal `auth.uid()` on every table
 * (verified in tests/integration/rls-privacy.mjs), and the repository layer
 * is the one place that's allowed to know that (design D10).
 */
export async function requireUserId(): Promise<string> {
  const {
    data: { session },
  } = await getClient().auth.getSession();

  if (!session) {
    throw new Error('No signed-in user — this action requires authentication.');
  }

  return session.user.id;
}
