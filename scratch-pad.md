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
  - In _map_to_experience_response(): include preferred_start_date/time

## Follow-up (later)
Use these fields to prefill or auto-suggest the first EventRun in the scheduler after approval.

## Performance scratchpad: Explore page

### Next steps (pick one first, then measure)
- Backend latency reduction: Add short TTL caching for GET /explore (e.g., 30-60 seconds) and optimize event_run_service.explore_upcoming_event_runs query and indexes.
- Perceived speed: Render placeholder experience cards immediately on /explore so TimeToFirstExperienceCardRendered improves even when API is slow; swap in real cards when data arrives.
