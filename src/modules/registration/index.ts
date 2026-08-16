import { registerModule } from '@/core/registry/registry';
import type { ModuleManifest } from '@/core/registry/types';

/**
 * The composition root: the one file allowed to name every module, because
 * something has to import them for their manifests to exist (design D2).
 *
 * The shell must never import this list — it reads the registry instead. This
 * file exists so that "which modules are in the build" is a single greppable
 * decision rather than a scattered set of side-effecting imports.
 *
 * Adding a module is one line here and nothing anywhere else.
 */
const manifests: ModuleManifest[] = [
  // Coffee lands in task 10.1.
];

let registered = false;

/** Called once at startup, before the first screen renders. Idempotent, so a fast refresh does not throw on duplicate ids. */
export function registerModules(): void {
  if (registered) return;
  manifests.forEach(registerModule);
  registered = true;
}
