-- =====================================================
-- Ensure Experiences Table Exists
-- =====================================================
-- Creates experiences table with all required columns matching ExperienceCreate schema
-- =====================================================

-- Create status enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE experience_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create experiences table if it doesn't exist
CREATE TABLE IF NOT EXISTS experiences (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Host relationship
    host_id UUID NOT NULL,
    
    -- Core Experience Details
    title TEXT NOT NULL,
    promise TEXT NOT NULL,
    description TEXT NOT NULL,
    unique_element TEXT NOT NULL,
    host_story TEXT NOT NULL,
    
    -- Categorization
    experience_domain TEXT NOT NULL,
    experience_theme TEXT,
    
    -- Location Details
    country TEXT NOT NULL DEFAULT 'India',
    city TEXT NOT NULL DEFAULT 'Mumbai',
    neighborhood TEXT,
    meeting_landmark TEXT NOT NULL,
    meeting_point_details TEXT NOT NULL,
    
    -- Experience Logistics
    duration_minutes INTEGER NOT NULL,
    traveler_min_capacity INTEGER NOT NULL DEFAULT 1,
    traveler_max_capacity INTEGER NOT NULL,
    price_inr DECIMAL(10, 2) NOT NULL,
    
    -- Experience Content (JSONB arrays)
    inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    traveler_should_bring JSONB NOT NULL DEFAULT '[]'::jsonb,
    accessibility_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Safety & Guidelines
    weather_contingency_plan TEXT,
    photo_sharing_consent_required BOOLEAN NOT NULL DEFAULT true,
    experience_safety_guidelines TEXT,
    
    -- Status & Workflow
    status experience_status NOT NULL DEFAULT 'draft',
    admin_feedback TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    
    -- Constraints
    CONSTRAINT check_duration CHECK (duration_minutes >= 30 AND duration_minutes <= 480),
    CONSTRAINT check_capacity CHECK (traveler_min_capacity >= 1 AND traveler_max_capacity >= traveler_min_capacity AND traveler_max_capacity <= 4),
    CONSTRAINT check_price CHECK (price_inr > 0),
    CONSTRAINT check_title_length CHECK (char_length(title) >= 10 AND char_length(title) <= 200),
    CONSTRAINT check_promise_length CHECK (char_length(promise) >= 20 AND char_length(promise) <= 200),
    CONSTRAINT check_description_length CHECK (char_length(description) >= 100 AND char_length(description) <= 2000),
    CONSTRAINT check_unique_element_length CHECK (char_length(unique_element) >= 50 AND char_length(unique_element) <= 500),
    CONSTRAINT check_host_story_length CHECK (char_length(host_story) >= 50 AND char_length(host_story) <= 1000)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_experiences_host_id ON experiences(host_id);
CREATE INDEX IF NOT EXISTS idx_experiences_status ON experiences(status);
CREATE INDEX IF NOT EXISTS idx_experiences_domain ON experiences(experience_domain);
CREATE INDEX IF NOT EXISTS idx_experiences_created_at ON experiences(created_at);
CREATE INDEX IF NOT EXISTS idx_experiences_city ON experiences(city);
CREATE INDEX IF NOT EXISTS idx_experiences_neighborhood ON experiences(neighborhood) WHERE neighborhood IS NOT NULL;

-- Create GIN indexes for JSONB arrays
CREATE INDEX IF NOT EXISTS idx_experiences_inclusions ON experiences USING GIN (inclusions);
CREATE INDEX IF NOT EXISTS idx_experiences_traveler_should_bring ON experiences USING GIN (traveler_should_bring);
CREATE INDEX IF NOT EXISTS idx_experiences_accessibility_notes ON experiences USING GIN (accessibility_notes);

-- Add comments for documentation
COMMENT ON TABLE experiences IS 'Stores experience listings created by hosts. Experiences go through draft → submitted → approved/rejected workflow.';
COMMENT ON COLUMN experiences.status IS 'Workflow status: draft (editing), submitted (awaiting review), approved (live), rejected (needs changes), archived (hidden)';
COMMENT ON COLUMN experiences.inclusions IS 'JSONB array of what is included in the experience';
COMMENT ON COLUMN experiences.traveler_should_bring IS 'JSONB array of items travelers should bring';
COMMENT ON COLUMN experiences.accessibility_notes IS 'JSONB array of accessibility considerations';

