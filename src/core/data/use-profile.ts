import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getProfile, updateProfile, type ProfilePatch } from '@/core/data/profiles';
import { queryKeys } from '@/core/data/query-keys';
import type { Profile } from '@/core/types/domain';

/** The signed-in user's own profile (task 6.5). */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: () => getProfile(),
  });
}

/**
 * Optimistic, like the other mutation hooks: the new name shows the moment
 * it is saved and rolls back if the write fails (user-account: "Editing the
 * profile").
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: ProfilePatch) => updateProfile(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.profile.all });
      const previous = queryClient.getQueryData<Profile>(queryKeys.profile.me());

      if (previous) {
        queryClient.setQueryData<Profile>(queryKeys.profile.me(), {
          ...previous,
          displayName: patch.displayName?.trim() ?? previous.displayName,
        });
      }

      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.profile.me(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
}
