import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createItem,
  deleteItem,
  getItem,
  type ItemPatch,
  listItems,
  type NewItemInput,
  updateItem,
} from '@/core/data/items';
import {
  insertIntoLists,
  patchInLists,
  removeFromLists,
  restoreLists,
  snapshotLists,
  tempId,
} from '@/core/data/optimistic';
import { queryKeys } from '@/core/data/query-keys';
import type { Item } from '@/core/types/domain';

/** The current user's items, newest first — see entries.ts for the shape this follows (task 3.3). */
export function useItems<TPayload = Record<string, unknown>>(
  filter: { moduleId?: string; itemType?: string } = {},
) {
  return useQuery({
    queryKey: queryKeys.items.list(filter),
    queryFn: () => listItems<TPayload>(filter),
  });
}

export function useItem<TPayload = Record<string, unknown>>(id: string) {
  return useQuery({
    queryKey: queryKeys.items.detail(id),
    queryFn: () => getItem<TPayload>(id),
    enabled: Boolean(id),
  });
}

export function useCreateItem<TPayload = Record<string, unknown>>() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewItemInput<TPayload>) => createItem<TPayload>(input),
    onMutate: async (input) => {
      const snapshots = await snapshotLists<Item<TPayload>>(queryClient, queryKeys.items.lists());

      const optimistic: Item<TPayload> = {
        id: tempId(),
        userId: '',
        moduleId: input.moduleId,
        itemType: input.itemType,
        name: input.name,
        payload: input.payload,
        archivedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      insertIntoLists(queryClient, queryKeys.items.lists(), optimistic);

      return { snapshots };
    },
    onError: (_error, _input, context) => {
      if (context) restoreLists(queryClient, context.snapshots);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
    },
  });
}

export function useUpdateItem<TPayload = Record<string, unknown>>() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ItemPatch<TPayload> }) =>
      updateItem<TPayload>(id, patch),
    onMutate: async ({ id, patch }) => {
      const snapshots = await snapshotLists<Item<TPayload>>(queryClient, queryKeys.items.lists());
      await queryClient.cancelQueries({ queryKey: queryKeys.items.detail(id) });
      const previousDetail = queryClient.getQueryData<Item<TPayload>>(queryKeys.items.detail(id));

      const fieldPatch: Partial<Item<TPayload>> = {
        name: patch.name,
        archivedAt: patch.archivedAt,
        payload: patch.payload,
      };
      patchInLists(queryClient, queryKeys.items.lists(), id, fieldPatch);
      if (previousDetail) {
        queryClient.setQueryData(queryKeys.items.detail(id), {
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
        queryClient.setQueryData(queryKeys.items.detail(context.id), context.previousDetail);
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(id) });
    },
  });
}

/** Callers implement the reference-clearing warning (task 9.6); this just performs the optimistic delete. */
export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onMutate: async (id) => {
      const snapshots = await snapshotLists<Item>(queryClient, queryKeys.items.lists());
      removeFromLists<Item>(queryClient, queryKeys.items.lists(), id);
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      if (context) restoreLists(queryClient, context.snapshots);
    },
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      queryClient.removeQueries({ queryKey: queryKeys.items.detail(id) });
    },
  });
}
