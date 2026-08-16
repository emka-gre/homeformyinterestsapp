import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { QueryProvider } from '@/core/data/query-provider';
import { registerModules } from '@/modules/registration';

// At import time, before the first screen renders — the navigation bar and
// capture menu read the registry during their first render, so registration
// cannot wait for an effect.
registerModules();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryProvider>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryProvider>
  );
}
