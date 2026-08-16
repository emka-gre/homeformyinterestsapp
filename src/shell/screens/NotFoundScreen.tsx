import { StyleSheet, Text, View } from 'react-native';

/**
 * Shown when a route names something the registry cannot resolve — a stale
 * deep link, or a module removed from the build while an enablement row for
 * it survives. A dead end is preferable to a crash.
 */
export function NotFoundScreen({ message }: { message: string }) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Not found</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 6 },
  title: { fontSize: 20, fontWeight: '600' },
  message: { opacity: 0.6, textAlign: 'center' },
});
