## speed.MD

This document is built for increasing the speed of the application overall in terms of performance.

### Goals (what "fast" means)

- **Perceived speed**: users see meaningful content quickly (skeleton -> real content).
- **Network efficiency**: fewer requests, smaller payloads, better caching.
- **Bundle efficiency**: ship less JS on initial routes; load heavy code only when needed.
- **Stability**: avoid regressions (stale data, auth leakage, broken caching).

### How we will measure (before/after)

- **Core web vitals**: LCP, INP, CLS, TTFB (Lighthouse + Web Vitals in production).
- **Route timing focus**: `/` (Explore/Home), `/host-dashboard`, `/experiences/*/runs/*`.
- **API focus**: request count per page, total bytes, slowest endpoints, p95 latency.
- **Definition of done**: each task should have a measurable delta (example: requests drop from N+1 to 1; bundle size -X KB; LCP -Y ms).

### Priority order (highest impact first)

#### P0 (do immediately, biggest wins)

1. **Remove N+1 requests on Host Dashboard**

   - **Problem**: dashboard loads experiences, then fetches photos per experience in a loop (serial N+1).
   - **Fix (preferred)**: backend returns `cover_photo_url` with `/experiences/my` (or a bulk "photos by experience_ids" endpoint).
   - **Expected impact**: large reduction in requests and dashboard load time.
   - **Challenges**: consistent cover photo selection logic; caching/invalidation when cover photo changes.

2. **Code-split heavy dashboard tabs and modals**

   - **Problem**: `/host-dashboard` imports heavy components up front (scheduler, list, preview, creation flows) even when the user never opens those tabs.
   - **Fix**: `next/dynamic` load by tab/modal open; keep the default tab minimal.
   - **Expected impact**: faster first render and first interaction on the dashboard.
   - **Challenges**: client-only boundaries, fallback UI quality, avoiding loading flicker.

3. **Explore/Home: reduce initial payload + add incremental loading**
   - **Problem**: large default result sets (example: `limit=50`) and large initial render.
   - **Fix**: start with 12-20 items; add "Load more" or infinite scroll; prefetch next page on scroll/idle.
   - **Expected impact**: improved LCP and less JS work on initial paint.
   - **Challenges**: pagination API shape; UX details; preventing duplicate loads.

#### P1 (high value, after P0)

4. **Lazy load below-the-fold sections on run detail pages**

   - **Problem**: run detail pages tend to grow (reviews, host details, long content).
   - **Fix**: render booking-critical info first; lazy-load secondary sections.
   - **Challenges**: hydration boundaries; maintain good UX while loading.

5. **Image performance pass**

   - **Fixes**:
     - Use `next/image` for experience cards and hero images with correct `sizes`.
     - Only the first 1-2 above-the-fold images use `priority`; the rest should be lazy.
     - Ensure CDN/caching headers for images where applicable.
   - **Challenges**: preventing layout shift; remote image configuration.

6. **Cache headers + server-side caching for public endpoints**
   - **Fix**: add safe `Cache-Control` for public explore/event-run endpoints (short TTL + `stale-while-revalidate` where safe).
   - **Challenges**: correctness; do not cache host/private responses; invalidation on status changes.

#### P2 (nice-to-have / longer-term)

7. **Persisted browser cache for Explore (optional)**

   - **Fix**: persist React Query cache for public explore results with short TTL (5-15 minutes).
   - **Challenges**: stale listings; cache versioning; storage bloat.

8. **Prefetching strategy**

   - **Fix**: prefetch run detail data on card hover or viewport intersection (throttled).
   - **Challenges**: wasted bandwidth on mobile; careful prefetch rules.

9. **Backend query optimization**
   - **Fix**: add indexes for common explore filters/sorts; reduce p95 latency.
   - **Challenges**: requires database visibility; careful migrations; validate with metrics.

### Challenges we will face (and mitigations)

- **Stale data vs speed**: keep TTL short; use stale-while-revalidate patterns; invalidate caches on mutations.
- **Auth leakage in caching**: never cache host/private responses in shared caches; persist only public results.
- **Dynamic import complexity**: avoid loading flicker with strong skeletons and predictable fallbacks.
- **Measurement discipline**: prioritize changes with clear before/after metrics, not only "feels faster".

### Suggested execution sequence (1-2 day slices)

- **Slice 1**: Host Dashboard N+1 removal + measure request count drop.
- **Slice 2**: Dashboard dynamic imports + measure bundle size and interaction timing.
- **Slice 3**: Explore initial limit + pagination + measure LCP and total bytes.
- **Slice 4**: Images + lazy sections + cache headers.
