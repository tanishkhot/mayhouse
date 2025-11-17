-- =====================================================
-- Add Q&A Answers Column to Design Sessions
-- =====================================================
-- Add qa_answers JSONB column to store guided Q&A flow answers
-- =====================================================

-- Ensure table exists (idempotent)
CREATE TABLE IF NOT EXISTS experience_design_sessions (
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

-- Add qa_answers column to store Q&A answers as JSON array
ALTER TABLE experience_design_sessions 
ADD COLUMN IF NOT EXISTS qa_answers JSONB DEFAULT '[]'::jsonb;

-- Add index for faster queries on qa_answers
CREATE INDEX IF NOT EXISTS idx_design_sessions_qa_answers 
ON experience_design_sessions USING GIN (qa_answers);

-- Add comment for documentation
COMMENT ON COLUMN experience_design_sessions.qa_answers IS 
'Array of Q&A answers from the guided "Let''s Build Together" flow. Each answer includes question_id, question_text, answer, and metadata.';
