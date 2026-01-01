-- Add optional proposed first event run date/time to experiences table
-- These values are used to prefill Event Run scheduling after the experience is approved.

ALTER TABLE experiences
ADD COLUMN IF NOT EXISTS first_event_run_date DATE,
ADD COLUMN IF NOT EXISTS first_event_run_time TIME;


