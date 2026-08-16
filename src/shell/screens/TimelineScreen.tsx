import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useEnabledModules } from '@/core/data/use-user-modules';
import { routes } from '@/shell/navigation/routes';

/**
 * The timeline (task 5.1 places it; group 11 fills it in). The entry query
 * and per-module card rendering land in tasks 11.1–11.3 — what exists here
 * now is the no-modules-enabled empty state, which the shell needs before
 * any module does (module-registry: "No modules enabled").
 */
export function TimelineScreen() {
  const router = useRouter();
  const { modules, isLoading } = useEnabledModules();

  if (!isLoading && modules.length === 0) {
    return (
      <View style={styles.centre}>
        <Text style={styles.emptyTitle}>Nothing to log yet</Text>
        <Text style={styles.emptyBody}>
          Enable a module and whatever you log will land here.
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.cta}
          onPress={() => router.navigate(routes.profile)}
        >
          <Text style={styles.ctaLabel}>Choose modules</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Timeline</Text>
      <Text style={styles.note}>
        Entries land here once the timeline query ships (task 11.1).
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 8 },
  title: { fontSize: 28, fontWeight: '600' },
  note: { opacity: 0.6, lineHeight: 20 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '600' },
  emptyBody: { opacity: 0.6, textAlign: 'center' },
  cta: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1f6feb',
  },
  ctaLabel: { color: '#fff', fontWeight: '600' },
});
