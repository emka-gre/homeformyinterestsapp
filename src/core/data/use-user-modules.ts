import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { queryKeys } from '@/core/data/query-keys';
import { listUserModules, setModuleEnabled, type UserModule } from '@/core/data/user-modules';
import { listModules } from '@/core/registry/registry';
import type { ModuleManifest } from '@/core/registry/types';

/** The current user's raw enablement rows (task 4.5). Most callers want useEnabledModules instead. */
export function useUserModules() {
  return useQuery({
    queryKey: queryKeys.userModules.list(),
    queryFn: () => listUserModules(),
  });
}

/**
 * The registered modules this user has enabled, in their stored order.
 *
 * A module with no row is treated as disabled, matching the migration's
 * "absence means not enabled". The intersection with the registry is
 * deliberate in both directions: a row for a module that no longer exists in
 * the build is ignored rather than crashing navigation, and a newly shipped
 * module stays invisible until the user opts in.
 *
 * Only navigation and capture may consult this — rendering never does
 * (design D3), or a disabled module's existing entries would break.
 */
export function useEnabledModules(): {
  modules: ModuleManifest[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useUserModules();

  const modules = useMemo(() => {
    const enablement = new Map<string, UserModule>(
      (data ?? []).map((row) => [row.moduleId, row]),
    );

    return listModules()
      .filter((manifest) => enablement.get(manifest.id)?.enabled === true)
      .sort(
        (a, b) =>
          (enablement.get(a.id)?.position ?? 0) - (enablement.get(b.id)?.position ?? 0),
      );
  }, [data]);

  return { modules, isLoading, error };
}

/**
 * Toggling is optimistic: the nav entry appears or disappears on tap rather
 * than after a round trip, and rolls back if the write fails.
 */
export function useSetModuleEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ moduleId, enabled }: { moduleId: string; enabled: boolean }) =>
      setModuleEnabled(moduleId, enabled),
    onMutate: async ({ moduleId, enabled }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.userModules.all });
      const previous = queryClient.getQueryData<UserModule[]>(queryKeys.userModules.list());

      queryClient.setQueryData<UserModule[]>(queryKeys.userModules.list(), (old) => {
        const rows = old ?? [];
        const existing = rows.find((row) => row.moduleId === moduleId);
        if (existing) {
          return rows.map((row) => (row.moduleId === moduleId ? { ...row, enabled } : row));
        }
        // First toggle of this module — no row exists yet to update.
        return [...rows, { moduleId, enabled, position: rows.length }];
      });

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.userModules.list(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userModules.all });
    },
  });
}
