import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Whether the backend is configured on this device. The app is built before
 * the hosted project exists (tasks 1.x precede 2.x), so nothing may throw at
 * import time — a missing key must not stop a screen from rendering.
 */
export const isBackendConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/**
 * The backend client. Only the repository layer may call this — screens and
 * modules go through repositories and query hooks (design D10).
 */
export function getClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      'Backend is not configured. Set EXPO_PUBLIC_SUPABASE_URL and ' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY in .env — see .env.example.',
    );
  }

  client ??= createClient(url, anonKey, {
    auth: {
      // On native there is no URL bar to read a session back out of, and
      // sessions must survive a restart, so they live in AsyncStorage.
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  });

  return client;
}
