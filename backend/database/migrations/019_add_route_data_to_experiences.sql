-- Add route_data column to experiences table for storing waypoints and geometry
ALTER TABLE experiences
ADD COLUMN IF NOT EXISTS route_data JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation describing the expected structure
COMMENT ON COLUMN experiences.route_data IS 'JSONB structure containing waypoints (array), geometry (GeoJSON), and metadata for the experience route.';

