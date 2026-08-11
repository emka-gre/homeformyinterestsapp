import type {
  EntryTypeDefinition,
  ItemTypeDefinition,
  ModuleManifest,
} from '@/core/registry/types';

const modules = new Map<string, ModuleManifest>();

/**
 * Registers a module at startup. Ids must be unique: two modules answering to
 * the same id would make every lookup below ambiguous, and silently preferring
 * one would be worse than refusing.
 */
export function registerModule(manifest: ModuleManifest): void {
  const existing = modules.get(manifest.id);
  if (existing && existing !== manifest) {
    throw new Error(
      `Module id "${manifest.id}" is already registered by "${existing.name}".`,
    );
  }

  for (const entryType of manifest.entryTypes) {
    const duplicate = manifest.entryTypes.filter(
      (candidate) => candidate.id === entryType.id,
    );
    if (duplicate.length > 1) {
      throw new Error(
        `Module "${manifest.id}" declares entry type "${entryType.id}" more than once.`,
      );
    }
  }

  modules.set(manifest.id, manifest);
}

/**
 * Every registered module, enabled or not. Callers building navigation or the
 * capture menu must filter by enablement themselves — rendering must not
 * (design D3).
 */
export function listModules(): ModuleManifest[] {
  return [...modules.values()];
}

export function getModule(moduleId: string): ModuleManifest | undefined {
  return modules.get(moduleId);
}

export function getEntryType(
  moduleId: string,
  entryTypeId: string,
): EntryTypeDefinition | undefined {
  return getModule(moduleId)?.entryTypes.find(
    (entryType) => entryType.id === entryTypeId,
  );
}

export function getItemType(
  moduleId: string,
  itemTypeId: string,
): ItemTypeDefinition | undefined {
  return getModule(moduleId)?.itemTypes.find(
    (itemType) => itemType.id === itemTypeId,
  );
}

/**
 * The renderer for an entry, resolved without consulting enablement. A user
 * who disables Coffee still sees their old brews in the timeline, rendered
 * normally (module-registry: "Entries from a disabled module still render").
 */
export function getFeedCard(
  moduleId: string,
): ModuleManifest['FeedCard'] | undefined {
  return getModule(moduleId)?.FeedCard;
}

export function getDetailView(
  moduleId: string,
  entryTypeId: string,
): EntryTypeDefinition['DetailView'] | undefined {
  return getEntryType(moduleId, entryTypeId)?.DetailView;
}

/** Only for tests and the dummy-module check in task 5.4. */
export function resetRegistry(): void {
  modules.clear();
}
