import { StyleSheet, Text, View } from 'react-native';

import { getEntryType, getModule } from '@/core/registry/registry';
import { NotFoundScreen } from '@/shell/screens/NotFoundScreen';

/**
 * The capture form for one entry type (task 5.3 routes to it).
 *
 * A module may supply its own `CaptureScreen`; otherwise the generic
 * schema-driven form renders here — that generator is task 4.4, so for now
 * this states what it will render rather than pretending to save anything.
 */
export function CaptureScreen({
  moduleId,
  entryTypeId,
}: {
  moduleId: string;
  entryTypeId: string;
}) {
  const manifest = getModule(moduleId);
  const entryType = getEntryType(moduleId, entryTypeId);

  if (!manifest || !entryType) {
    return (
      <NotFoundScreen message={`"${moduleId}" has no entry type "${entryTypeId}".`} />
    );
  }

  if (entryType.CaptureScreen) {
    const { CaptureScreen: ModuleCapture } = entryType;
    return <ModuleCapture entryTypeId={entryTypeId} />;
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{entryType.label}</Text>
      <Text style={styles.subtitle}>{manifest.name}</Text>
      <Text style={styles.note}>
        The generic schema-driven form lands in task 4.4. Until then this route
        exists to prove the shell reaches a module&apos;s capture flow without
        naming the module.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, gap: 6, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '600' },
  subtitle: { fontSize: 14, opacity: 0.6 },
  note: { marginTop: 12, opacity: 0.6, lineHeight: 20 },
});
