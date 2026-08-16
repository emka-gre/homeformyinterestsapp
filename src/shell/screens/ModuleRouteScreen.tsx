import { getModule } from '@/core/registry/registry';
import { NotFoundScreen } from '@/shell/screens/NotFoundScreen';

/**
 * Renders a screen a module declared in `manifest.routes` (task 5.3). The
 * shell resolves it by path and hands over rendering entirely — it never
 * knows what the screen contains.
 */
export function ModuleRouteScreen({
  moduleId,
  path,
}: {
  moduleId: string;
  path: string;
}) {
  const manifest = getModule(moduleId);
  const route = manifest?.routes?.find((candidate) => candidate.path === path);

  if (!route) {
    return (
      <NotFoundScreen message={`"${moduleId}" has no screen at "${path}".`} />
    );
  }

  const { Screen } = route;
  return <Screen />;
}
