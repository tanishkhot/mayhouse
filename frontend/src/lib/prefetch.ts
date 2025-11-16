import { QueryClient } from '@tanstack/react-query';
import { ExploreAPI } from './api';
import { EventRunAPI } from './event-run-api';
import { experienceAPI } from './experience-api';

/**
 * Prefetch utilities to preload data before navigation
 * This makes routing feel instant by loading data in the background
 */

let queryClientInstance: QueryClient | null = null;

export function setQueryClient(client: QueryClient) {
  queryClientInstance = client;
}

/**
 * Prefetch explore page data
 */
export function prefetchExplore() {
  if (!queryClientInstance) return;
  
  queryClientInstance.prefetchQuery({
    queryKey: ['explore'],
    queryFn: () => ExploreAPI.getUpcomingExperiences({ limit: 50 }),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Prefetch experience details
 */
export function prefetchExperience(experienceId: string) {
  if (!queryClientInstance) return;
  
  queryClientInstance.prefetchQuery({
    queryKey: ['experience', experienceId],
    queryFn: () => experienceAPI.getExperience(experienceId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Prefetch event run details
 */
export function prefetchEventRun(runId: string) {
  if (!queryClientInstance) return;
  
  queryClientInstance.prefetchQuery({
    queryKey: ['eventRun', runId],
    queryFn: () => EventRunAPI.getPublicEventRunDetails(runId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Prefetch host experiences
 */
export function prefetchHostExperiences() {
  if (!queryClientInstance) return;
  
  queryClientInstance.prefetchQuery({
    queryKey: ['hostExperiences'],
    queryFn: () => experienceAPI.getHostExperiences(50, 0),
    staleTime: 5 * 60 * 1000,
  });
}

