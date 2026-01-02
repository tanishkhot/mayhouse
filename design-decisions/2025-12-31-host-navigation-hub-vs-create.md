# Decision: Host navigation is a hub (host-dashboard) and creation is a task flow (design-experience)

- Date: 2025-12-31
- Status: Accepted
- Owners: Mayhouse team
- Related:
  - docs/next-plan-hosts-to-bookings.md

## Context

We currently have two entry points that render the same experience creation UI (DesignExperienceV2):
- /host-dashboard (Create Experience tab)
- /design-experience (standalone route)

This causes user confusion about where to create vs manage. As traffic grows, hosts will increasingly return to the product to manage operations (approvals, scheduling, bookings) rather than always starting a new listing.

Assumptions:
- Around 500 DAUs
- Around 3 experiences going live per day
- Around 500 bookings per day

## Decision

We will treat hosting as a hub-and-spoke flow:
- Host home (hub): /host-dashboard
- Creation/editing (task flow): /design-experience

User-facing behavior:
- Navbar "Host" should take authenticated hosts to /host-dashboard.
- From /host-dashboard, a host can start creation (which takes them into /design-experience).

## Options considered

1. Hub pattern (recommended): Host -> /host-dashboard
   - Pros:
     - Best for returning hosts who need to manage operations (event runs, bookings, approvals).
     - Scales naturally as we add more host tasks (payouts, messaging, attendance).
     - Keeps the creation wizard focused and reduces cognitive load.
   - Cons:
     - One extra click for brand-new hosts who only want to create immediately.

2. Creation-first pattern: Host -> /design-experience
   - Pros:
     - Fastest path for new hosts to start creating.
   - Cons:
     - Not ideal for returning hosts with frequent operational tasks.
     - Over time the creation flow risks becoming a dumping ground for management features.

## Why this decision

User experience:
- As volume grows, hosts will come back primarily to manage ongoing work (approval status, runs, bookings).
- A dashboard-first flow matches common marketplace mental models and reduces navigation friction for returning users.

Engineering and product:
- The hub becomes the place to add and organize more host workflows without bloating the creation wizard.
- Clear separation between "manage" and "create" reduces duplicated UI states and future refactors.

## Consequences

- Positive:
  - Clear, consistent mental model for hosts: manage in dashboard, create in wizard.
  - Easier to evolve host operations without destabilizing creation.

- Negative / tradeoffs:
  - Slightly slower path for new hosts who only want to create (one click from dashboard to wizard).

- Follow-ups / next steps:
  - Ensure /host-dashboard has strong CTAs to start creation (and edit existing drafts).
  - Ensure /design-experience has a clear way back to /host-dashboard after save/submit.

## Rollout plan

- Update navigation targets (navbar and dashboard CTAs) to align to the hub pattern.
- Keep backward-compatible direct access to /design-experience (deep links, bookmarks).

## Success metrics

- Reduced user confusion in testing (qualitative feedback).
- Increased completion rate of experience creation (draft -> submitted).
- Reduced time for hosts to find operational tasks (event runs, bookings).

## Notes

If we later see that most "Host" clicks are from first-time creators, we can add a smart shortcut:
- If host has zero experiences, route Host -> /design-experience.
- Else route Host -> /host-dashboard.


