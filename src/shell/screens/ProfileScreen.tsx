import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useProfile, useUpdateProfile } from '@/core/data/use-profile';
import { useSession } from '@/core/data/session-provider';
import { useSetModuleEnabled, useUserModules } from '@/core/data/use-user-modules';
import { listModules } from '@/core/registry/registry';

/**
 * The profile screen: who you are (task 6.5), which modules you have on
 * (task 6.6), and the way out (task 6.3).
 *
 * The module list is every *registered* module, not every enabled one — this
 * is the screen you use to enable something, so it must show what is
 * available.
 */
export function ProfileScreen() {
  const { session, signOut } = useSession();
  const { data: enablement, isLoading } = useUserModules();
  const setEnabled = useSetModuleEnabled();
  const registered = listModules();

  const isEnabled = (moduleId: string) =>
    enablement?.find((row) => row.moduleId === moduleId)?.enabled ?? false;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Profile</Text>

      <Text style={styles.sectionTitle}>You</Text>
      <DisplayNameField />
      {session?.email ? <Text style={styles.meta}>{session.email}</Text> : null}

      <Text style={styles.sectionTitle}>Modules</Text>
      {registered.length === 0 ? (
        <Text style={styles.empty}>No modules are registered in this build.</Text>
      ) : (
        registered.map((manifest) => (
          <View key={manifest.id} style={styles.row}>
            <Text style={styles.rowIcon}>{manifest.icon}</Text>
            <Text style={styles.rowLabel}>{manifest.name}</Text>
            <Switch
              accessibilityLabel={manifest.name}
              disabled={isLoading}
              value={isEnabled(manifest.id)}
              onValueChange={(enabled) =>
                setEnabled.mutate({ moduleId: manifest.id, enabled })
              }
            />
          </View>
        ))
      )}

      <Pressable
        accessibilityRole="button"
        style={styles.signOut}
        onPress={() => confirmSignOut(signOut)}
      >
        <Text style={styles.signOutLabel}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

/**
 * Sign-out is cheap to undo (open the email again) but still deserves one
 * tap of confirmation — the button sits under the module toggles, where a
 * stray touch is plausible. Alert has no web implementation, so web asks
 * with the browser's own confirm dialog.
 */
function confirmSignOut(signOut: () => Promise<void>) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.('Sign out on this device?') ?? true) void signOut();
    return;
  }
  Alert.alert('Sign out?', 'Your entries stay on your account. This device will forget them.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
  ]);
}

/**
 * The display name, editable in place: type, then blur or press return to
 * save. The field mirrors the server value until the user starts typing, so
 * a save from another device shows up here rather than being overwritten
 * (user-account: "Editing the profile").
 */
function DisplayNameField() {
  const { data: profile, isLoading, error } = useProfile();
  const update = useUpdateProfile();
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    // A finished save, or a fresh load, hands control back to the server value.
    if (!update.isPending) setDraft(null);
  }, [profile?.displayName, update.isPending]);

  const value = draft ?? profile?.displayName ?? '';

  const commit = () => {
    const next = value.trim();
    if (!profile || !next || next === profile.displayName) {
      setDraft(null);
      return;
    }
    update.mutate({ displayName: next });
  };

  if (error) {
    return <Text style={styles.error}>Couldn&apos;t load your profile: {error.message}</Text>;
  }

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>Display name</Text>
      <TextInput
        accessibilityLabel="Display name"
        style={styles.input}
        value={value}
        editable={!isLoading && Boolean(profile)}
        placeholder={isLoading ? 'Loading…' : 'Your name'}
        onChangeText={setDraft}
        onBlur={commit}
        onSubmitEditing={commit}
        returnKeyType="done"
        autoCapitalize="words"
      />
      {update.isError ? (
        <Text style={styles.error}>Couldn&apos;t save: {update.error.message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 4 },
  title: { fontSize: 28, fontWeight: '600', marginBottom: 12 },
  sectionTitle: {
    fontSize: 12,
    opacity: 0.5,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 4,
  },
  field: { gap: 6, paddingVertical: 4 },
  fieldLabel: { fontSize: 13, opacity: 0.7 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.4)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  meta: { fontSize: 13, opacity: 0.5, paddingTop: 6 },
  error: { color: '#c0392b', fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  rowIcon: { fontSize: 22 },
  rowLabel: { fontSize: 16, flex: 1 },
  empty: { opacity: 0.6, paddingVertical: 12 },
  signOut: { marginTop: 32, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  signOutLabel: { color: '#c0392b', fontWeight: '600' },
});
