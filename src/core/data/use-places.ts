import { useQuery } from '@tanstack/react-query';

import { getPlace, listPlaces } from '@/core/data/places';
import { queryKeys } from '@/core/data/query-keys';

/**
 * Read hooks only (task 3.3) — places don't get mutation hooks yet because
 * nothing calls them until the place picker (task 8.5). Creation still goes
 * through `createPlace` in places.ts directly until then.
 */
export function usePlaces() {
  return useQuery({
    queryKey: queryKeys.places.list(),
    queryFn: () => listPlaces(),
  });
}

export function usePlace(id: string) {
  return useQuery({
    queryKey: queryKeys.places.detail(id),
    queryFn: () => getPlace(id),
    enabled: Boolean(id),
  });
}
