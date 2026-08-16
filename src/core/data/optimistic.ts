import type { QueryClient, QueryKey } from '@tanstack/react-query';

/**
 * Shared optimistic-update plumbing for the entry and item mutation hooks
 * (task 3.4). Both follow the same shape — a filtered set of list queries
 * plus one detail query per id — so the cancel/snapshot/rollback dance lives
 * here once instead of being copy-pasted per entity.
 */

interface ListSnapshot<T> {
  key: QueryKey;
  data: T[] | undefined;
}

/** Snapshots every currently-cached list query under `listPrefix`, for rollback in onError. */
export async function snapshotLists<T>(
  queryClient: QueryClient,
  listPrefix: QueryKey,
): Promise<ListSnapshot<T>[]> {
  await queryClient.cancelQueries({ queryKey: listPrefix });
  return queryClient
    .getQueriesData<T[]>({ queryKey: listPrefix })
    .map(([key, data]) => ({ key, data }));
}

export function restoreLists<T>(queryClient: QueryClient, snapshots: ListSnapshot<T>[]): void {
  snapshots.forEach(({ key, data }) => queryClient.setQueryData(key, data));
}

/** Prepends the optimistic item to every cached list under `listPrefix` — order is corrected by the refetch in onSettled. */
export function insertIntoLists<T>(
  queryClient: QueryClient,
  listPrefix: QueryKey,
  item: T,
): void {
  queryClient.setQueriesData<T[]>({ queryKey: listPrefix }, (old) =>
    old ? [item, ...old] : old,
  );
}

export function patchInLists<T extends { id: string }>(
  queryClient: QueryClient,
  listPrefix: QueryKey,
  id: string,
  patch: Partial<T>,
): void {
  queryClient.setQueriesData<T[]>({ queryKey: listPrefix }, (old) =>
    old?.map((entity) => (entity.id === id ? { ...entity, ...patch } : entity)),
  );
}

export function removeFromLists<T extends { id: string }>(
  queryClient: QueryClient,
  listPrefix: QueryKey,
  id: string,
): void {
  queryClient.setQueriesData<T[]>({ queryKey: listPrefix }, (old) =>
    old?.filter((entity) => entity.id !== id),
  );
}

/** A client-side id for an entity that hasn't been assigned one by the database yet, so the optimistic row can be told apart and reconciled once the real one arrives via invalidation. */
export function tempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
