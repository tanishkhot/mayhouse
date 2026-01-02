# Scratchpad: Add date/time fields to experience creation (preferred first run)

## Goal

Add two optional fields below Category and Duration in the experience creation UI:

- Date
- Time

Persist them to the backend on the experience record so they are available for later event-run scheduling.

Note: /explore shows event runs, not experiences. These fields do not directly affect /explore until a host schedules an event run.

## SQL (run in Supabase SQL editor)

```sql
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS preferred_start_date date,
  ADD COLUMN IF NOT EXISTS preferred_start_time time;

COMMENT ON COLUMN public.experiences.preferred_start_date IS 'Host proposed first run date (used for scheduling later)';
COMMENT ON COLUMN public.experiences.preferred_start_time IS 'Host proposed first run time (used for scheduling later)';

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'experiences'
  AND column_name IN ('preferred_start_date', 'preferred_start_time');
```

## Frontend changes

### 1) Add form fields to DesignExperienceV2

- Add to `FormState`:
  - preferredStartDate?: string (YYYY-MM-DD)
  - preferredStartTime?: string (HH:MM)
- Add to `INITIAL` with empty string defaults.
- Add UI inputs (type=date, type=time) below Category and Duration using existing input styles.

### 2) Map fields into payload

- Update `frontend/src/lib/experience-mapper.ts`:
  - In `mapFormToExperienceCreate`, send:
    - preferred_start_date
    - preferred_start_time
  - In `mapExperienceResponseToForm`, read:
    - preferred_start_date
    - preferred_start_time

### 3) Types

- Update `frontend/src/lib/experience-api.ts`:
  - Add optional fields on ExperienceCreate/Update/Response:
    - preferred_start_date?: string
    - preferred_start_time?: string

## Backend changes

### 1) Schemas

- Update `backend/app/schemas/experience.py`:
  - ExperienceCreate:
    - preferred_start_date: Optional[date]
    - preferred_start_time: Optional[time]
  - ExperienceUpdate:
    - preferred_start_date: Optional[date]
    - preferred_start_time: Optional[time]
  - ExperienceResponse:
    - preferred_start_date: Optional[date]
    - preferred_start_time: Optional[time]

### 2) Persist in service

- Update `backend/app/services/experience_service.py`:
  - In create_experience(): include preferred_start_date/time in experience_record
  - In update_experience(): allow updating preferred_start_date/time
  - In \_map_to_experience_response(): include preferred_start_date/time

## Follow-up (later)

Use these fields to prefill or auto-suggest the first EventRun in the scheduler after approval.

## Performance scratchpad: Explore page

### Next steps (pick one first, then measure)

- Backend latency reduction: Add short TTL caching for GET /explore (e.g., 30-60 seconds) and optimize event_run_service.explore_upcoming_event_runs query and indexes.
- Perceived speed: Render placeholder experience cards immediately on /explore so TimeToFirstExperienceCardRendered improves even when API is slow; swap in real cards when data arrives.

## Experience run detail redesign (plan + execution tasks)

---

### Scope & Approach

- **Scope selected:**

  - **Frontend + API**  
    Extend backend `/event-runs/{id}` payload to include cover photo, promise, rich description, includes/bring, meeting point, and reviews if available.

  - **Motion scope:**  
    _Defer advanced motion_. Implement minimal CSS transitions only; do not add new animation/motion dependencies for now.

---

### Documentation: `docs/experience-run-detail-redesign.md`

- Add (or update) file:
  - List and reference relevant Figma specs and previous design docs for Experience Detail pages.
  - Before/after checklist: note which color tokens, system components/primitives, layout/state rules, and data mapping/fallback logic have been changed in this redesign.
  - Document all API fields required for the new UI, noting what is missing and fallback rendering for absent data.
  - Reference:
    - docs/design-guidelines-from-figmamake-for-experiencepage-i-guess/\*
    - docs/desing-update-with-experience-poage-figmamake/components/ExperienceDetailRefined.tsx

---

### Frontend requirements

#### On `frontend/src/app/experiences/[experienceId]/runs/[runId]/page.tsx`:

- **Replace all hardcoded color classes** — e.g.:
  - `bg-white` → `bg-background`
  - `text-gray-*` → `text-foreground` or `text-muted-foreground`
  - `border-gray-*` → `border-border`
  - `bg-accent`, `bg-muted`, as appropriate
- **Remove any non-system hero gradients**
  - _If present, replace with token-based backgrounds or optional image with overlay for consistency_
- **Use standardized primitives:**
  - Replace manual HTML or custom elements with: `Card`, `Button`, `Badge`, `Separator`, `Skeleton` (from component system)
- **Interactive elements 5-state rule:**
  - All `Button`, `Input`, main CTAs must consistently support:
    - default
    - hover (300ms, token color change)
    - active (scale-95, 100ms)
    - focus-visible (token ring/outline)
    - disabled (token-based disabled state)
- **Sticky booking sidebar on desktop:**
  - Use `sticky top-24` classes for right/book sidebar
  - Ensure responsiveness/overflow
- **Mobile CTA bar:**
  - Add a fixed bottom action bar for booking (mobile breakpoints only), using token backgrounds and primitives

---

### Data mapping & fallbacks

- **API Integration:**
  - Fetch with `EventRunAPI.getPublicEventRunDetails(runId)` as before
  - Map new fields from API:
    - `cover_photo_url`/`experience_cover_photo_url`
    - `promise`, `long_description`, `includes`, `what_to_bring`, `meeting_point`, `reviews`, `rating`, `review_count`
  - Gracefully fallback:
    - No cover photo → show card with placeholder image using token background
    - No reviews → show "New" badge and trust indicators
    - Empty includes/bring → omit those sections from render
    - No meeting point/etc. → hide section

---

### API/schema changes

- **Backend:**
  - Update `/event-runs/{id}` public response and relevant backend schemas to include:
    - `cover_photo_url` or `experience_cover_photo_url`
    - `experience_promise` or `tagline`
    - `long_description`/`what_to_expect`
    - `includes` (list), `what_to_bring` (list)
    - `meeting_point` (address string), and if possible, `meeting_lat`, `meeting_lng`
    - `rating` (avg), `review_count`, and (if available) `reviews[]`
- **Frontend types:**
  - Update `frontend/src/lib/event-run-api.ts` types/interfaces for the new fields

---

### Tokens & Style rules (summary)

- **Colors:**  
   Use only system tokens (`bg-background`, `bg-card`, `text-foreground`, `border-border`, etc.)
- **Component spacing, sizing:**  
   Follow design guideline spacings/tokens only. Do not hardcode px/gap.
- **Figma spec links:**  
   Reference in docs for every visual rule applied.

---

### Motion

- No new libraries for now. Use only minimal CSS transitions for:
  - Hover (token color, 300ms ease)
  - Active (scale-95, 100ms)
  - Focus-visible (token ring, 200ms)
  - All transitions must respect `prefers-reduced-motion`

---

### Before/After Checklist (for doc)

- [ ] All section colors tokens replaced (no hardcoded grays/whites)
- [ ] Primitives (Card, Button, Badge, Skeleton, Separator) used consistently
- [ ] Sidebar is sticky on desktop, mobile bar appears on mobile
- [ ] Booking/CTA has correct 5-state behavior for accessibility
- [ ] Fallbacks in place for all potentially missing API fields
- [ ] Experience run detail API extended to support new fields; mapped in frontend types
- [ ] All style/layout changes referenced to tokens and documented (tokens/state/motion)

---

**Next step:**

- Update the Experience Run Detail page, component usage, and types as outlined above.
- Create/update detailed documentation in `docs/experience-run-detail-redesign.md` with before/after, Figma references, token/state rules, and fallback behaviors.

---

### Experience run detail redesign - completion checklist (Jan 2026)

- [x] Update `frontend/src/app/experiences/[experienceId]/runs/[runId]/page.tsx` to token-only colors (no bg-white, text-gray-_, border-gray-_, no gradients)
- [x] Replace ad-hoc markup with primitives (`Card`, `Button`, `Badge`, `Separator`, `Skeleton`, `Avatar`)
- [x] Enforce 5-state rule on interactive elements (default, hover 300ms, active scale-95 100ms, focus-visible ring, disabled)
- [x] Desktop: booking sidebar sticky at `top-24`
- [x] Loading uses `Skeleton` / `bg-muted` (no hardcoded gray)
- [x] Mobile: fixed bottom CTA bar implemented (scroll-to-booking fallback, no motion deps)
- [x] Tokenize shared components used by the flow:
  - [x] `frontend/src/components/BookEventButton.tsx` (modal + buttons + error/success states)
  - [x] `frontend/src/components/PriceDisplay.tsx`
  - [x] `frontend/src/components/landing/ImageWithFallback.tsx`
- [x] Remove double navbar on run detail route by hiding global navbar for `/experiences/:experienceId/runs/:runId`
- [ ] Add `docs/experience-run-detail-redesign.md` explaining what changed and why

Notes:

- Scope kept frontend-only for this pass (no backend payload changes).
- Reference-only docs used for implementation guidance:
  - `docs/desing-update-with-experience-poage-figmamake/guidelines/ColorStateQuickRef.md`
  - `docs/desing-update-with-experience-poage-figmamake/guidelines/ExperienceDetailSpec.md`
  - `docs/desing-update-with-experience-poage-figmamake/components/ExperienceDetailRefined.tsx`

---

## Route Visualization & Testing (Phase 2)

### Status: Phase 1 Complete - Basic Map Display

Phase 1 (completed): Added interactive map to experience run detail page showing meeting point location when coordinates are available.

### Phase 2 Tasks: Route Flow End-to-End Testing

- [ ] **Test complete route flow end-to-end:**
  - [ ] Verify route data (`route_data` with waypoints) is properly stored in experience creation flow
  - [ ] Test route data retrieval from backend API (`/event-runs/{id}` endpoint)
  - [ ] Verify route waypoints are correctly parsed and displayed on map
  - [ ] Test route polyline rendering between waypoints
  - [ ] Verify route visualization appears correctly on experience run detail page
  - [ ] Test with multiple waypoints (start, stops, end)
  - [ ] Test edge cases: single waypoint, no route data, invalid coordinates
  - [ ] Ensure route visualization works on mobile and desktop
  - [ ] Verify route data persists through experience updates
  - [ ] Test route display matches design specifications

**Goal:** Complete end-to-end testing of the route creation → storage → retrieval → visualization flow until routes are fully functional and displayed on the experience run detail page.
