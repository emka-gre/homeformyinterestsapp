import { useLocalSearchParams } from 'expo-router';

import { ModuleHomeScreen } from '@/shell/screens/ModuleHomeScreen';

/** Any module's home screen — the id is a parameter, never a filename. */
export default function ModuleHomeRoute() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  return <ModuleHomeScreen moduleId={moduleId} />;
}
