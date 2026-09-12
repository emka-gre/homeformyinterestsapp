import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { completeSignIn, useSession } from '@/core/data';
import { routes } from '@/shell/navigation/routes';

type Phase = { kind: 'working' } | { kind: 'failed'; message: string };

/**
 * Where a sign-in link lands (task 6.1). The link's tokens ride in the URL,
 * so this screen reads the URL that opened the app rather than route
 * params, hands it to the auth repository, and moves on to the timeline
 * (user-account: "Valid link").
 *
 * A link that has expired or already been used gets refused by the backend;
 * this screen says so and offers a fresh one (user-account: "Expired or
 * reused link"). It is reachable whether or not someone is signed in —
 * opening a link while signed in simply swaps the session. A dead link
 * opened while signed in (the common case: tapping the old email again)
 * cannot offer a new one, because the sign-in screen is guarded away; it
 * just carries on to the timeline instead.
 */
export function AuthCallbackScreen() {
  const router = useRouter();
  const { status } = useSession();
  const url = Linking.useURL();
  const [phase, setPhase] = useState<Phase>({ kind: 'working' });

  useEffect(() => {
    // Null until the platform has reported the URL that opened the app.
    if (!url) return;

    let active = true;
    completeSignIn(url)
      .then(() => {
        if (active) router.replace(routes.timeline);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPhase({
          kind: 'failed',
          message:
            error instanceof Error
              ? error.message
              : 'This sign-in link could not be used.',
        });
      });

    return () => {
      active = false;
    };
  }, [url, router]);

  if (phase.kind === 'failed' && status === 'signed-in') {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>You&apos;re already signed in</Text>
        <Text style={styles.body}>
          That link has expired or was already used, but there is nothing to do — this device is
          signed in.
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.primary}
          onPress={() => router.replace(routes.timeline)}
        >
          <Text style={styles.primaryLabel}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  if (phase.kind === 'failed') {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>That link didn&apos;t work</Text>
        <Text style={styles.body}>{phase.message}</Text>
        <Text style={styles.body}>
          Sign-in links only work once and expire after a while. Request a new one and open it
          on this device.
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.primary}
          onPress={() =>
            router.replace({
              pathname: routes.signIn,
              params: { notice: 'That sign-in link has expired or was already used.' },
            })
          }
        >
          <Text style={styles.primaryLabel}>Send a new link</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ActivityIndicator />
      <Text style={styles.body}>Signing you in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  title: { fontSize: 22, fontWeight: '600' },
  body: { opacity: 0.6, textAlign: 'center', lineHeight: 20 },
  primary: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1f6feb',
  },
  primaryLabel: { color: '#fff', fontWeight: '600' },
});
