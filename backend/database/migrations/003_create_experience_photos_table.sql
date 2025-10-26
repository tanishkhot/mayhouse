-- Migration: Create experience_photos table for storing experience images
-- Description: Stores photos for experiences with support for cover photos
-- Date: 2025-10-26

-- Create experience_photos table
CREATE TABLE IF NOT EXISTS experience_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    is_cover_photo BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    caption TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one cover photo per experience
    CONSTRAINT unique_cover_photo_per_experience 
        EXCLUDE (experience_id WITH =) WHERE (is_cover_photo = true)
);

-- Create indexes for performance
CREATE INDEX idx_experience_photos_experience_id ON experience_photos(experience_id);
CREATE INDEX idx_experience_photos_cover ON experience_photos(is_cover_photo) WHERE is_cover_photo = true;
CREATE INDEX idx_experience_photos_display_order ON experience_photos(experience_id, display_order);

-- Add comment for documentation
COMMENT ON TABLE experience_photos IS 'Stores photos for experiences with Supabase storage URLs';
COMMENT ON COLUMN experience_photos.photo_url IS 'Full URL to the photo in Supabase storage bucket';
COMMENT ON COLUMN experience_photos.is_cover_photo IS 'Indicates if this is the main cover photo (only one per experience)';
COMMENT ON COLUMN experience_photos.display_order IS 'Order in which photos should be displayed (0 = first)';

