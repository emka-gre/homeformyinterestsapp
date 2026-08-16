import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createEntry,
  deleteEntry,
  type EntryPatch,
  getEntry,
  listEntries,
  type NewEntryInput,
  updateEntry,
} from '@/core/data/entries';
import {
  insertIntoLists,
  patchInLists,
  removeFromLists,
  snapshotLists,
  restoreLists,
  tempId,
} from '@/core/data/optimistic';
import { queryKeys } from '@/core/data/query-keys';
import type { Entry } from '@/core/types/domain';

/** The current user's entries, newest first — the timeline's query, optionally scoped to one module's library view (task 3.3). */
export function useEntries<TPayload = Record<string, unknown>>(moduleId?: string) {
  return useQuery({
    queryKey: queryKeys.entries.list(moduleId),
    queryFn: () => listEntries<TPayload>(moduleId),
  });
}

export function useEntry<TPayload = Record<string, unknown>>(id: string) {
  return useQuery({
    queryKey: queryKeys.entries.detail(id),
    queryFn: () => getEntry<TPayload>(id),
    enabled: Boolean(id),
  });
}

/**
 * Logging an entry must not depend on connectivity (design D10): the new
 * entry appears in every cached list immediately, and a failure rolls it
 * back rather than blocking on the network round trip.
 */
export function useCreateEntry<TPayload = Record<string, unknown>>() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewEntryInput<TPayload>) => createEntry<TPayload>(input),
    onMutate: async (input) => {
      const snapshots = await snapshotLists<Entry<TPayload>>(queryClient, queryKeys.entries.lists());

      const optimistic: Entry<TPayload> = {
        id: tempId(),
        userId: '',
        moduleId: input.moduleId,
        entryType: input.entryType,
        occurredAt: input.occurredAt ?? new Date().toISOString(),
        status: input.status ?? 'done',
        visibility: input.visibility ?? 'private',
        rating: input.rating ?? null,
        notes: input.notes ?? null,
        tags: input.tags ?? [],
        itemId: input.itemId ?? null,
        placeId: input.placeId ?? null,
        payload: input.payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      insertIntoLists(queryClient, queryKeys.entries.lists(), optimistic);

      return { snapshots };
    },
    onError: (_error, _input, context) => {
      if (context) restoreLists(queryClient, context.snapshots);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.all });
    },
  });
}

export function useUpdateEntry<TPayload = Record<string, unknown>>() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: EntryPatch<TPayload> }) =>
      updateEntry<TPayload>(id, patch),
    onMutate: async ({ id, patch }) => {
      const snapshots = await snapshotLists<Entry<TPayload>>(queryClient, queryKeys.entries.lists());
      await queryClient.cancelQueries({ queryKey: queryKeys.entries.detail(id) });
      const previousDetail = queryClient.getQueryData<Entry<TPayload>>(
        queryKeys.entries.detail(id),
      );

      const fieldPatch: Partial<Entry<TPayload>> = {
        occurredAt: patch.occurredAt,
        status: patch.status,
        visibility: patch.visibility,
        rating: patch.rating,
        notes: patch.notes,
        tags: patch.tags,
        itemId: patch.itemId,
        placeId: patch.placeId,
        payload: patch.payload,
      };
      patchInLists(queryClient, queryKeys.entries.lists(), id, fieldPatch);
      if (previousDetail) {
        queryClient.setQueryData(queryKeys.entries.detail(id), {
          ...previousDetail,
          ...fieldPatch,
        });
      }

      return { snapshots, previousDetail, id };
    },
    onError: (_error, _vars, context) => {
      if (!context) return;
      restoreLists(queryClient, context.snapshots);
      if (context.previousDetail) {
        queryClient.setQueryData(queryKeys.entries.detail(context.id), context.previousDetail);
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.detail(id) });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEntry(id),
    onMutate: async (id) => {
      const snapshots = await snapshotLists<Entry>(queryClient, queryKeys.entries.lists());
      removeFromLists<Entry>(queryClient, queryKeys.entries.lists(), id);
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      if (context) restoreLists(queryClient, context.snapshots);
    },
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entries.all });
      queryClient.removeQueries({ queryKey: queryKeys.entries.detail(id) });
    },
  });
}
