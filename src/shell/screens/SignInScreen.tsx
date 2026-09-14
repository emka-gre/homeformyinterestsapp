import * as Linking from 'expo-linking';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { isBackendConfigured, sendSignInLink } from '@/core/data';
import { routes } from '@/shell/navigation/routes';

type Phase = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Where the emailed link should land: the callback route on *this* build —
 * `nook://auth/callback` on a device, `exp://…/--/auth/callback` in Expo
 * Go, `http://localhost:8081/auth/callback` on web. createURL wants the
 * path without its leading slash, or it doubles up.
 */
function callbackUrl(): string {
  return Linking.createURL(routes.authCallback.replace(/^\//, ''));
}

/**
 * The only screen a signed-out user sees (task 6.1). One field, one button:
 * the address gets a sign-in link, and the same flow creates the account if
 * it did not exist — the screen never learns which, and so cannot leak it
 * (user-account: "Email already registered").
 *
 * `initialNotice` lets the callback screen hand over a reason — a link that
 * expired — so the offer to send a fresh one reads as a continuation rather
 * than a cold start.
 */
export function SignInScreen({ initialNotice }: { initialNotice?: string } = {}) {
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  const canSend = EMAIL_PATTERN.test(email.trim()) && phase.kind !== 'sending';

  const send = async () => {
    if (!canSend) return;
    setPhase({ kind: 'sending' });
    try {
      await sendSignInLink(email, callbackUrl());
      setPhase({ kind: 'sent' });
    } catch (error) {
      setPhase({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Could not send the link.',
      });
    }
  };

  if (phase.kind === 'sent') {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.body}>
          A sign-in link is on its way to {email.trim()}. Open it on this device to continue.
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.secondary}
          onPress={() => setPhase({ kind: 'idle' })}
        >
          <Text style={styles.secondaryLabel}>Use a different address</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Nook</Text>
      <Text style={styles.body}>
        Enter your email and we&apos;ll send you a link to sign in. No password to remember.
      </Text>

      {initialNotice ? <Text style={styles.notice}>{initialNotice}</Text> : null}

      {!isBackendConfigured ? (
        <Text style={styles.error}>
          The backend is not configured on this build — set EXPO_PUBLIC_SUPABASE_URL and
          EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.
        </Text>
      ) : null}

      <TextInput
        accessibilityLabel="Email address"
        style={styles.input}
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={send}
        editable={phase.kind !== 'sending'}
      />

      {phase.kind === 'error' ? <Text style={styles.error}>{phase.message}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        style={[styles.primary, !canSend && styles.primaryDisabled]}
        onPress={send}
      >
        {phase.kind === 'sending' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryLabel}>Send sign-in link</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: 28, gap: 12 },
  title: { fontSize: 32, fontWeight: '700' },
  body: { opacity: 0.6, lineHeight: 20 },
  notice: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,170,0,0.15)',
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.4)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 8,
  },
  error: { color: '#c0392b', lineHeight: 20 },
  primary: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1f6feb',
  },
  primaryDisabled: { opacity: 0.4 },
  primaryLabel: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondary: { marginTop: 8, alignSelf: 'flex-start' },
  secondaryLabel: { color: '#1f6feb', fontWeight: '600' },
});
