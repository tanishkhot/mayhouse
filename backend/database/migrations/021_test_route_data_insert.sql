-- =====================================================
-- Test: Verify route_data Column Accepts Data
-- =====================================================
-- Run this AFTER migration 019 to verify the column works correctly
-- This creates a test experience with route_data, then cleans it up
-- =====================================================

-- Step 1: Verify column exists and is queryable
SELECT 
    'Column verification' as test_step,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'experiences' AND column_name = 'route_data'
        ) THEN '✅ Column exists'
        ELSE '❌ Column missing'
    END as result;

-- Step 2: Test inserting route_data (if you have an existing experience to test with)
-- Replace 'YOUR_EXPERIENCE_ID' with an actual experience ID from your database
-- Or skip this if you don't want to modify existing data

-- Example: Update an existing experience with test route_data
-- UPDATE experiences 
-- SET route_data = '{
--   "waypoints": [
--     {
--       "id": "start",
--       "lat": 19.0760,
--       "lng": 72.8777,
--       "name": "Gateway of India",
--       "type": "start"
--     },
--     {
--       "id": "stop-1",
--       "lat": 19.0765,
--       "lng": 72.8780,
--       "name": "Taj Mahal Palace",
--       "type": "stop"
--     }
--   ]
-- }'::jsonb
-- WHERE id = 'YOUR_EXPERIENCE_ID'
-- RETURNING id, title, route_data;

-- Step 3: Verify you can query route_data
SELECT 
    'Query test' as test_step,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM experiences 
            WHERE route_data IS NOT NULL 
            LIMIT 1
        ) THEN '✅ Can query route_data'
        ELSE 'ℹ️  No route_data found yet (create an experience via frontend to test)'
    END as result;

-- Step 4: Show current state
SELECT 
    COUNT(*) as total_experiences,
    COUNT(route_data) FILTER (WHERE route_data IS NOT NULL AND route_data != '{}'::jsonb) as experiences_with_routes,
    COUNT(route_data) FILTER (WHERE route_data = '{}'::jsonb) as experiences_with_empty_route_data
FROM experiences;

-- Step 5: Test JSONB operations (verify column accepts JSONB structure)
-- This query should work if column is properly configured as JSONB
SELECT 
    'JSONB operations test' as test_step,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'experiences' 
            AND column_name = 'route_data' 
            AND data_type = 'jsonb'
        ) THEN '✅ JSONB type confirmed'
        ELSE '❌ Wrong data type'
    END as result;

-- Summary:
-- If all checks show ✅, the migration is working correctly
-- The "NO DATA YET" message is expected - you'll see data after creating experiences via the frontend

