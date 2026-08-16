import { useLocalSearchParams } from 'expo-router';

import { ModuleRouteScreen } from '@/shell/screens/ModuleRouteScreen';

/** Any screen a module declares in `manifest.routes` (task 5.3). */
export default function ModuleRoute() {
  const { moduleId, path } = useLocalSearchParams<{ moduleId: string; path: string }>();
  return <ModuleRouteScreen moduleId={moduleId} path={path} />;
}
