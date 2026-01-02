## Experience Run Detail Redesign

### Purpose
Redesign the Experience Run Detail page (`/experiences/:experienceId/runs/:runId`) to match the Mayhouse token-based design system and feel like the Explore card "expanded", while keeping the first pass frontend-only.

### References (read-only, do not import/reuse)
- `docs/desing-update-with-experience-poage-figmamake/guidelines/ColorStateQuickRef.md`
- `docs/desing-update-with-experience-poage-figmamake/guidelines/ExperienceDetailSpec.md`
- `docs/desing-update-with-experience-poage-figmamake/components/ExperienceDetailRefined.tsx`

### Files changed
- `frontend/src/app/experiences/[experienceId]/runs/[runId]/page.tsx`
- `frontend/src/components/BookEventButton.tsx`
- `frontend/src/components/PriceDisplay.tsx`
- `frontend/src/components/landing/ImageWithFallback.tsx`
- `frontend/src/components/Navbar.tsx`

### What changed and why
#### 1) Token-only color system (hard requirement)
Removed hardcoded utilities such as `bg-white`, `text-gray-*`, `border-gray-*`, and ad-hoc gradients in favor of tokens:
- Surfaces: `bg-background`, `bg-card`, `bg-muted`, `bg-accent`
- Text: `text-foreground`, `text-muted-foreground`
- Borders and rings: `border-border`, `ring-ring/50`
- Status: `text-chart-1` for trust, `text-destructive` for destructive

This ensures dark mode compatibility and visual consistency across the app.

#### 2) Expanded-card continuity and page structure
The page now follows the spec's continuity model:
- Hero media container (image if available, token placeholder otherwise)
- Category + availability badges overlaid on the hero
- Title, location, and a simple "New" rating label
- Chip row (duration, group size, date/time)
- Host card
- Booking card in a sticky sidebar on desktop (`lg:sticky lg:top-24`)

#### 3) Interaction state consistency (5-state rule)
All interactive elements now follow:
- Default
- Hover (300ms)
- Active/Pressed (`active:scale-95` with 100ms)
- Focus-visible ring (`ring-[3px] ring-ring/50`)
- Disabled (`opacity-50` and `pointer-events-none`)

This is applied to the run detail page controls, date selection, and the booking modal buttons.

#### 4) Loading and error states
- Loading uses `Skeleton` and token surfaces (no gray hardcodes).
- Error state uses token card + button for navigation.

#### 5) Mobile bottom CTA
Added a fixed bottom CTA bar (token-only). It uses a simple "scroll to booking" behavior and does not add any motion dependency.

#### 6) Remove double navbar on run detail
The global `Navbar` is hidden on `/experiences/:experienceId/runs/:runId` because the run detail page provides its own contextual sticky header. This reduces cognitive load and preserves hierarchy (one header per screen).

### Data usage and fallbacks
Data source remains:
- `EventRunAPI.getPublicEventRunDetails(runId)`

Used fields (current API):
- `experience_title`, `experience_domain`
- `duration_minutes`, `max_capacity`
- `booking_summary.available_spots`
- `neighborhood`
- `start_datetime`
- `price_inr`
- `host_name`, `host_wallet_address`
- `host_meeting_instructions`

Fallback behaviors:
- If a cover photo URL exists in the payload (e.g. `cover_photo_url`), it is rendered; otherwise a token placeholder is shown.
- If price is missing, UI renders "Price TBA".
- If availability is 0, the selector and CTA become disabled and show sold-out messaging.

### Out of scope (this pass)
- Backend payload changes (adding richer experience content, reviews, meeting point objects, etc.).
- Adding motion libraries (Framer Motion / motion/react).

### Quick verification checklist
- Run detail shows only one header (page-level contextual header).
- No hardcoded `bg-white`, `text-gray-*`, `border-gray-*`, `bg-gray-*` in the files listed above.
- Desktop: booking sidebar sticks at `top-24`.
- Mobile: bottom CTA bar visible and does not cover content.
- Keyboard navigation shows focus-visible rings on interactive elements.

