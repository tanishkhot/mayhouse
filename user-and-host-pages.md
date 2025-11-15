### Traveler-Facing Pages to Design & Implement

- `/experiences/[experienceId]` – public detail page with storytelling, availability, host profile, and waitlist/booking CTA.
- `/experiences/[experienceId]/runs/[runId]/checkout` – interim booking or waitlist flow with payment placeholder, traveler info capture, confirmation.
- `/confirmation/[bookingId]` – booking recap, itinerary, support contacts, calendar links.
- `/account/bookings` – traveler dashboard for upcoming/past experiences, status, actions (cancel, message host).
- `/account/reviews` – interface to submit post-experience reviews, upload photos, claim proof tokens.
- `/support` (or `/help`) – self-serve FAQs, safety protocols, escalation paths for incidents.

### Host-Facing Pages to Design & Implement

- `/become-a-host` – marketing + intake landing page explaining ethos, benefits, eligibility, and guiding to application.
- `/host/apply` – multi-step onboarding wizard (profile, story, logistics, verification, payout setup).
- `/host/experiences/new` – experience template builder (narrative, itinerary, assets, capacity, pricing).
- `/host/experiences/[experienceId]/edit` – versioned editing with status indicators (draft, review, live).
- `/host/experiences/[experienceId]/runs/new` – event-run scheduler (dates, times, capacity, pricing overrides).
- `/host/experiences/[experienceId]/runs/[runId]` – operational view for a run: roster, messaging, notes, attendance toggle.
- `/host/payouts` – payout status, earnings summaries, tax documents, banking details.
- `/host/resources` – curated guidelines, storytelling tips, safety playbooks, best practices.

These are the key gaps to cover once `/`, `/explore`, and `/host/experiences` are in shape.
