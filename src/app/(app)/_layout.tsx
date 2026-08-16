import { Stack } from 'expo-router';

import { AppFrame } from '@/shell/navigation/AppFrame';

/**
 * Every in-app screen renders inside the shell chrome — navigation bar and
 * capture button. The routes beneath this layout are generic by design: one
 * dynamic route per shape of thing a module can declare, never one per
 * module (design D2).
 */
export default function AppLayout() {
  return (
    <AppFrame>
      <Stack screenOptions={{ headerShown: false }} />
    </AppFrame>
  );
}
