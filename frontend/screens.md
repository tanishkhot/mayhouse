Public (no auth)
•  Explore (catalog/grid of upcoming event runs)
◦  GET /explore/
◦  GET /event-runs (advanced filtering)
◦  GET /explore/categories
◦  GET /event-runs/featured
•  Experience details (public)
◦  GET /explore/{experience_id}  [mock for now]
◦  GET /event-runs/{event_run_id}  [public details; strips private host notes]
•  Legal/Policies
◦  GET /legal/*  [router is included in main; endpoints live in app/api/legal_policies.py]

Authentication and Profile
•  Sign up
◦  POST /auth/signup
•  Log in
◦  POST /auth/login
•  OAuth (optional)
◦  GET /auth/oauth/google/login → redirect
◦  GET /auth/oauth/google/callback
◦  POST /auth/oauth/google/mobile
◦  POST /auth/oauth/apple/mobile (501 placeholder)
•  Profile overview/edit
◦  GET /auth/me or GET /users/profile
◦  PUT /auth/me or PUT /users/profile
•  Logout
◦  POST /auth/logout

Traveler (authenticated user)
•  My bookings
◦  GET /users/bookings
•  Favorites
◦  GET /users/favorites
◦  POST /users/favorites/{experience_id}
◦  DELETE /users/favorites/{experience_id}
•  Notifications
◦  GET /users/notifications

Host onboarding
•  Check eligibility
◦  GET /users/host-application/eligibility
•  Submit application
◦  POST /users/host-application
•  Track application
◦  GET /users/host-application

Host: Experiences
•  My experiences list
◦  GET /experiences?status=...
•  Create experience
◦  POST /experiences
•  Experience detail
◦  GET /experiences/{experience_id}
•  Edit experience
◦  PUT /experiences/{experience_id}
•  Submit for review
◦  POST /experiences/{experience_id}/submit

Host: Event runs
•  Host runs list
◦  GET /hosts/event-runs?status=...
•  Create event run
◦  POST /hosts/event-runs
◦  or scoped to experience:
▪  GET /experiences/{experience_id}/runs
▪  POST /experiences/{experience_id}/runs
▪  GET /experiences/{experience_id}/runs/count
•  Event run detail
◦  GET /hosts/event-runs/{event_run_id}
•  Edit event run
◦  PUT /hosts/event-runs/{event_run_id}
•  Delete/cancel event run
◦  DELETE /hosts/event-runs/{event_run_id}
•  Host dashboard (summary)
◦  GET /hosts/event-runs/dashboard/summary

Admin: Host applications
•  Applications queue/list
◦  GET /admin/host-applications?status=...
•  Application detail
◦  GET /admin/host-applications/{application_id}
•  Review/decision
◦  POST /admin/host-applications/{application_id}/review
•  Application stats
◦  GET /admin/host-applications/stats

Admin: Experiences
•  Experiences list (all)
◦  GET /admin/experiences?status=...
•  Pending queue
◦  GET /admin/experiences/pending
•  Experience detail
◦  GET /admin/experiences/{experience_id}
•  Review/decision
◦  POST /admin/experiences/{experience_id}/review

Admin: Event runs
•  Event run stats
◦  GET /admin/event-runs/stats
•  Event runs list (all)
◦  GET /admin/event-runs?status=...&host_id=...

Suggested navigation structure
•  Public
◦  Explore
◦  Experience details
•  Account
◦  Login / Signup
◦  Profile
•  Traveler
◦  My bookings
◦  Favorites
◦  Notifications
•  Host
◦  Eligibility → Application → Application status
◦  Experiences: List → Create/Edit → Submit
◦  Event runs: List → Create/Edit/Delete → Per-experience runs
◦  Host dashboard (summary widgets)
•  Admin
◦  Host applications: Queue → Detail → Review
◦  Experiences: Queue → Detail → Review
◦  Event runs: Stats → List

Notes and gaps
•  Payments and Bookings creation:
◦  Not yet implemented in backend routes (no bookings or payments API in app/api). Frontend booking and payment screens can be scaffolded but will be blocked until backend endpoints land.
•  Explore vs Event-runs discovery:
◦  Two public discovery surfaces exist: /explore/* (conceptual, category-focused) and /event-runs (concrete, filterable runs). You can consolidate UI: Explore page uses /explore/ as default feed and exposes “Advanced filters” backed by /event-runs for richer querying.
•  Public experience detail:
◦  Currently mocked at GET /explore/{experience_id}. If you prefer run-first, you can deep-link into /event-runs/{event_run_id} and show experience summary alongside.