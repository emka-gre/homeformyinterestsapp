import { Stack } from 'expo-router';

/** The signed-out half of the app: no shell chrome, no navigation bar. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
