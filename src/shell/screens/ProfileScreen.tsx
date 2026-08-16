import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useSetModuleEnabled, useUserModules } from '@/core/data/use-user-modules';
import { listModules } from '@/core/registry/registry';

/**
 * The profile screen. Display-name editing is task 6.5; what exists here now
 * is the module toggle list (task 6.6), which is the only way to reach the
 * enablement state the navigation and capture menu read.
 *
 * The list is every *registered* module, not every enabled one — this is the
 * screen you use to enable something, so it must show what is available.
 */
export function ProfileScreen() {
  const { data: enablement, isLoading } = useUserModules();
  const setEnabled = useSetModuleEnabled();
  const registered = listModules();

  const isEnabled = (moduleId: string) =>
    enablement?.find((row) => row.moduleId === moduleId)?.enabled ?? false;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 4 },
  title: { fontSize: 28, fontWeight: '600', marginBottom: 12 },
  sectionTitle: {
    fontSize: 12,
    opacity: 0.5,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
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
});
