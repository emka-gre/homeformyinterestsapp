import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { CaptureButton } from '@/shell/capture/CaptureButton';
import { NavBar } from '@/shell/navigation/NavBar';

/**
 * The chrome every in-app screen sits inside: the routed screen, the floating
 * capture button, and the navigation bar. Kept separate from the route layout
 * so the pieces can be tested without a router mounted.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <View style={styles.content}>{children}</View>
      <CaptureButton />
      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
