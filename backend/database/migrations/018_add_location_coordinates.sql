-- Add latitude and longitude columns to experiences table
ALTER TABLE experiences 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add comment for documentation
COMMENT ON COLUMN experiences.latitude IS 'Latitude coordinate of the meeting point';
COMMENT ON COLUMN experiences.longitude IS 'Longitude coordinate of the meeting point';

