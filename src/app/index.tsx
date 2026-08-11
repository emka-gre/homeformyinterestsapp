import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Placeholder for task 1.5 — proves the shell renders on iOS, Android, and web
 * before anything real is built on top of it. The navigation shell replaces
 * this in task 5.1.
 */
export default function Placeholder() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centre}>
        <Text style={styles.title}>Nook</Text>
        <Text style={styles.subtitle}>a home for my interests</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 34, fontWeight: '600' },
  subtitle: { fontSize: 16, opacity: 0.6 },
});
