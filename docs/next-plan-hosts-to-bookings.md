# Next plan: hosts create event runs and get bookings

This document captures the recommended next engineering work to complete the core workflow for organizations (hosts) to publish event runs and receive bookings.

Context
- Hosts can already create experiences and schedule event runs.
- Travelers can already view event runs (home and /explore) and attempt to book.
- The remaining gaps are around conversion (auth), operations (host visibility), and production readiness (payments).

Goals
- Make booking reliable for travelers (clear auth flow, clear success/failure).
- Make bookings actionable for hosts (see who booked, counts, special requests).
- Improve discovery enough to drive bookings (basic filters/search).
- Prepare for production payments (real payment provider, refunds, payouts).

Priority 0 (must do next): host booking visibility per event run
- Problem:
  - Hosts cannot view booking details per event run in the host dashboard.
  - The host event run list shows availability but "View Details" is a TODO.
- Outcome:
  - Host can open an event run and see:
    - booking count
    - traveler count
    - booking statuses
    - traveler contact basics (as allowed)
    - special requests / notes (if supported)
- Backend work:
  - Add a host-scoped endpoint to fetch bookings for a host-owned event run.
  - Enforce ownership: only the host who owns the experience can access.
  - Return a stable shape for the UI (do not reuse admin-only payloads unless access is correct).
- Frontend work:
  - Implement the "View Details" action in the host dashboard event runs list.
  - Add an event run detail panel/modal with booking list and summary.
- Acceptance criteria:
  - A host can navigate from host dashboard -> event runs -> view details -> see bookings.
  - A different host cannot access the bookings for an event run they do not own.

Priority 1: booking UX - handle not-logged-in travelers cleanly
- Problem:
  - Booking endpoint requires authentication.
  - If a traveler is not logged in, booking fails with an error instead of a guided flow.
- Outcome:
  - If not authenticated, booking UI prompts login/signup and returns to the same run page.
  - After login, traveler can retry booking with minimal friction.
- Frontend work:
  - Add an auth gate in the booking UI (BookEventButton or page-level wrapper).
  - Preserve return URL (run detail page) so the traveler lands back where they started.
- Backend work:
  - Ensure errors are clear and consistent (401 for unauthenticated).
- Acceptance criteria:
  - Logged-out traveler clicking "Book" is prompted to log in and returns to the same run page.
  - Logged-in traveler can book successfully.

Priority 2: discovery filters (conversion improvement)
- Problem:
  - Discovery page is present but filtering is limited/commented out.
- Outcome:
  - Travelers can filter event runs by at least:
    - domain
    - neighborhood
    - date range (or "this week")
    - price range (optional)
- Frontend work:
  - Add UI controls and wire to explore/event runs listing API parameters.
- Backend work:
  - Confirm filtering is supported and fast enough; add indexes if needed.
- Acceptance criteria:
  - Filters change results and remain shareable via URL query parameters.

Priority 3: real payments, refunds, and host payouts (production readiness)
- Problem:
  - Payment processing is currently a placeholder/dummy.
  - Stake/refund logic is not end-to-end with a real payment provider.
- Outcome:
  - Payments work with a real provider (e.g., Razorpay), with:
    - payment success/failure states
    - receipt/confirmation
    - refund handling for stake when attended (or policy-defined logic)
    - host payout pipeline (even if manual at first)
- Work areas:
  - Payment intents/orders, webhook verification, idempotency
  - Booking state machine (pending -> confirmed -> cancelled/refunded)
  - Payout reconciliation/reporting
- Acceptance criteria:
  - A successful payment results in a confirmed booking.
  - Failed payments do not create confirmed bookings.
  - Refund flows are deterministic and logged.

Suggested execution order (next sprint)
1) Host booking visibility per run (Priority 0)
2) Booking auth gating (Priority 1)
3) Discovery filters (Priority 2)
4) Payments/refunds/payouts (Priority 3)


