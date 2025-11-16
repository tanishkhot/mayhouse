'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { prefetchExplore } from '@/lib/prefetch';

/**
 * Prefetches critical routes and data on initial load
 * This makes navigation feel instant
 */
export function RoutePrefetcher() {
  const pathname = usePathname();

  useEffect(() => {
    // Prefetch explore page data if we're on a page that might link to it
    if (pathname !== '/explore' && pathname !== '/') {
      // Prefetch explore data in the background
      prefetchExplore();
    }
  }, [pathname]);

  return null;
}

