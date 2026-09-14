import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { QueryProvider } from '@/core/data/query-provider';
import { SessionProvider, useSession } from '@/core/data/session-provider';
import { registerModules } from '@/modules/registration';

// At import time, before the first screen renders — the navigation bar and
// capture menu read the registry during their first render, so registration
// cannot wait for an effect.
registerModules();

// Held until the device has said whether it holds a session, so launch goes
// straight to the right screen instead of flashing through the wrong one
// (task 6.2).
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryProvider>
      <SessionProvider>
        <SafeAreaProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <RootNavigator />
            <StatusBar style="auto" />
          </ThemeProvider>
        </SafeAreaProvider>
      </SessionProvider>
    </QueryProvider>
  );
}

/**
 * Restore-or-redirect (task 6.2): the in-app routes exist only while a
 * session does, and the sign-in route only while one does not. When a
 * session appears or vanishes — a link opened, a sign-out, a refresh the
 * backend refused — the router moves to whichever side is now available
 * (user-account: "Reopening the app", "Session no longer valid").
 *
 * The callback route sits outside both guards: a sign-in link must be
 * openable whatever state the app is in.
 */
function RootNavigator() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'restoring') {
      void SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === 'restoring') {
    return null;
  }

  const signedIn = status === 'signed-in';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="auth/callback" />
    </Stack>
  );
}
