import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getModule } from '@/core/registry/registry';
import { routes } from '@/shell/navigation/routes';
import { NotFoundScreen } from '@/shell/screens/NotFoundScreen';

/**
 * A module's home screen, resolved entirely from its manifest (task 5.3).
 * The shell renders the module's name, its declared routes, and nothing it
 * had to know in advance.
 */
export function ModuleHomeScreen({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const manifest = getModule(moduleId);

  if (!manifest) {
    return <NotFoundScreen message={`No module is registered under "${moduleId}".`} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>{manifest.icon}</Text>
        <Text style={styles.title}>{manifest.name}</Text>
      </View>

      {manifest.routes?.length ? (
        manifest.routes.map((route) => (
          <Pressable
            key={route.path}
            accessibilityRole="button"
            style={styles.row}
            onPress={() => router.push(routes.moduleRoute(manifest.id, route.path))}
          >
            <Text style={styles.rowLabel}>{route.label}</Text>
            <Text style={styles.rowChevron}>›</Text>
          </Pressable>
        ))
      ) : (
        <Text style={styles.empty}>This module has no screens of its own yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  icon: { fontSize: 30 },
  title: { fontSize: 28, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  rowLabel: { fontSize: 16 },
  rowChevron: { fontSize: 20, opacity: 0.4 },
  empty: { opacity: 0.6, paddingVertical: 12 },
});
