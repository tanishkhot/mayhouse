-- Create table for design experience sessions
create table if not exists experience_design_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null,
  experience_id uuid default null,
  step_completion jsonb not null default '{}'::jsonb,
  basics_payload jsonb default '{}'::jsonb,
  logistics_payload jsonb default '{}'::jsonb,
  media_order jsonb default '[]'::jsonb,
  photos_preview jsonb default '[]'::jsonb,
  incomplete_fields jsonb not null default '{}'::jsonb,
  autosave_version int not null default 1,
  last_saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Simple index helpers
create index if not exists idx_design_sessions_host on experience_design_sessions(host_id);
create index if not exists idx_design_sessions_experience on experience_design_sessions(experience_id);

