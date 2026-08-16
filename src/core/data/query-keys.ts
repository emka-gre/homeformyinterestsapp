/**
 * Central query key factory (task 3.3). Every hook builds its keys from
 * here so invalidation stays consistent — a mutation that invalidates
 * `queryKeys.entries.all` catches every filtered list variant without
 * having to enumerate them.
 */
export const queryKeys = {
  entries: {
    /** Matches every entries query (list and detail alike) — for broad invalidation only. */
    all: ['entries'] as const,
    /** Matches list queries only, never detail — safe for the optimistic-update helpers in optimistic.ts, which assume the cached data is an array. */
    lists: () => ['entries', 'list'] as const,
    list: (moduleId?: string) => ['entries', 'list', moduleId ?? null] as const,
    detail: (id: string) => ['entries', 'detail', id] as const,
  },
  items: {
    all: ['items'] as const,
    lists: () => ['items', 'list'] as const,
    list: (filter: { moduleId?: string; itemType?: string } = {}) =>
      ['items', 'list', filter.moduleId ?? null, filter.itemType ?? null] as const,
    detail: (id: string) => ['items', 'detail', id] as const,
  },
  places: {
    all: ['places'] as const,
    lists: () => ['places', 'list'] as const,
    list: () => ['places', 'list'] as const,
    detail: (id: string) => ['places', 'detail', id] as const,
  },
  userModules: {
    all: ['user-modules'] as const,
    list: () => ['user-modules', 'list'] as const,
  },
};
