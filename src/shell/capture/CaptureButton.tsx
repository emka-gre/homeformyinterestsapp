import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEnabledModules } from '@/core/data/use-user-modules';
import type { ModuleManifest } from '@/core/registry/types';
import { routes } from '@/shell/navigation/routes';

/**
 * The capture button and its options menu (task 5.2). The options are the
 * flattened entry types of every enabled module — so a module that declares
 * two entry types contributes two options, and one that declares none
 * contributes nothing, with no shell change either way.
 *
 * Enablement gates capture but never rendering (design D3): a disabled
 * module's entries still appear in the timeline, they just cannot be added to.
 */
export function CaptureButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { modules } = useEnabledModules();
  const [menuOpen, setMenuOpen] = useState(false);

  const options = useMemo(
    () =>
      modules.flatMap((manifest) =>
        manifest.entryTypes.map((entryType) => ({ manifest, entryType })),
      ),
    [modules],
  );

  if (options.length === 0) {
    // Nothing to capture into. The profile's module list is the way out of
    // this state (module-registry: "No modules enabled").
    return null;
  }

  const openCapture = (manifest: ModuleManifest, entryTypeId: string) => {
    setMenuOpen(false);
    router.push(routes.capture(manifest.id, entryTypeId));
  };

  // A single enabled entry type needs no menu — tapping goes straight there.
  const onPress = () => {
    if (options.length === 1) {
      openCapture(options[0].manifest, options[0].entryType.id);
      return;
    }
    setMenuOpen(true);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log something"
        onPress={onPress}
        style={[styles.fab, { bottom: (insets.bottom || 8) + 72 }]}
      >
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          accessibilityLabel="Dismiss capture menu"
          onPress={() => setMenuOpen(false)}
        >
          <View style={[styles.sheet, { paddingBottom: (insets.bottom || 8) + 12 }]}>
            <Text style={styles.sheetTitle}>Log something</Text>
            <ScrollView>
              {options.map(({ manifest, entryType }) => (
                <Pressable
                  key={`${manifest.id}:${entryType.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${manifest.name} — ${entryType.label}`}
                  style={styles.option}
                  onPress={() => openCapture(manifest, entryType.id)}
                >
                  <Text style={styles.optionIcon}>{entryType.icon ?? manifest.icon}</Text>
                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{entryType.label}</Text>
                    <Text style={styles.optionModule}>{manifest.name}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f6feb',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  fabIcon: { color: '#fff', fontSize: 30, lineHeight: 34, fontWeight: '400' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: '60%',
  },
  sheetTitle: { fontSize: 13, opacity: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  optionIcon: { fontSize: 24 },
  optionText: { gap: 1 },
  optionLabel: { fontSize: 16, color: '#000' },
  optionModule: { fontSize: 12, opacity: 0.5, color: '#000' },
});
