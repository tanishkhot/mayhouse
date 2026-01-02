'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi-config';
import { ReactNode, useEffect } from 'react';
import { setQueryClient } from '@/lib/prefetch';
// React Query persistence is intentionally disabled to avoid SSR/CSR divergence.
// The original implementation is preserved below (commented out) so it can be restored later.
//
// import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
// import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
      gcTime: 10 * 60 * 1000, // 10 minutes - cache persists longer
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Use cached data if available
      retry: 1, // Only retry once on failure
      networkMode: 'online', // Only fetch when online
    },
  },
});

export function Web3Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Make queryClient available for prefetching
    setQueryClient(queryClient);
  }, []);

  // const isClient = typeof window !== 'undefined';
  // const persister = isClient
  //   ? createSyncStoragePersister({
  //       storage: window.localStorage,
  //       key: 'mayhouse_rq_cache_v1',
  //     })
  //   : null;

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>

      {/*
      NOTE: React Query persistence is disabled for now.
      To re-enable, uncomment imports above and this block, and restore persister creation.

      {persister ? (
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 10 * 60 * 1000,
            dehydrateOptions: {
              shouldDehydrateQuery: (query) => query.queryKey?.[0] === 'explore',
            },
          }}
          onSuccess={() => {
            try {
              console.log('[RQ_PERSIST]', {
                restored: true,
                key: 'mayhouse_rq_cache_v1',
              });
            } catch {}
          }}
        >
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </PersistQueryClientProvider>
      ) : (
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </QueryClientProvider>
      )}
      */}
    </WagmiProvider>
  );
}

