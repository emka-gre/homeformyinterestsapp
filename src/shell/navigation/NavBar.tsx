import { useRouter, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEnabledModules } from '@/core/data/use-user-modules';
import { routes } from '@/shell/navigation/routes';

/**
 * The bottom navigation bar (task 5.1): Timeline and Profile are fixed, and
 * everything between them is derived from the modules the user has enabled.
 *
 * Note what is absent — there is no list of module ids here, and no branch on
 * one. A module appears because it registered a manifest and the user enabled
 * it, which is the whole point (design D2).
 */
export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { modules } = useEnabledModules();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom || 8 }]}>
      <NavItem
        icon="◴"
        label="Timeline"
        active={pathname === routes.timeline}
        onPress={() => router.navigate(routes.timeline)}
      />

      {modules.map((manifest) => (
        <NavItem
          key={manifest.id}
          icon={manifest.icon}
          label={manifest.name}
          tint={manifest.color}
          active={pathname.startsWith(routes.module(manifest.id))}
          onPress={() => router.navigate(routes.module(manifest.id))}
        />
      ))}

      <NavItem
        icon="◔"
        label="Profile"
        active={pathname === routes.profile}
        onPress={() => router.navigate(routes.profile)}
      />
    </View>
  );
}

/** `icon` is rendered as a text glyph — manifests supply an emoji, which avoids an icon-font dependency for a bar this small. */
function NavItem({
  icon,
  label,
  active,
  tint,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  tint?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.item}
    >
      <Text style={[styles.icon, active && tint ? { color: tint } : null]}>{icon}</Text>
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.35)',
  },
  item: { alignItems: 'center', gap: 2, flex: 1, paddingHorizontal: 4 },
  icon: { fontSize: 20 },
  label: { fontSize: 11, opacity: 0.6 },
  labelActive: { opacity: 1, fontWeight: '600' },
});
