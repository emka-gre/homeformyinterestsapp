import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { ReactNode } from 'react';

import { persistOptions, queryClient } from '@/core/data/query-client';

/**
 * Wraps the app in the shared query client, restoring the persisted cache on
 * launch so a cold start shows the timeline rather than a spinner.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
