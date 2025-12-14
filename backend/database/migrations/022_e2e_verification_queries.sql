-- =====================================================
-- E2E Verification Queries for Route Planning Integration
-- =====================================================
-- Use these queries to verify route_data at each stage of testing
-- Run in Supabase SQL Editor after performing test actions
-- =====================================================

-- =====================================================
-- Query Set 1: Verify Created Experience with Route
-- =====================================================

-- Query 1.1: Find recently created experiences with route_data
-- Use this after creating an experience with waypoints
SELECT 
    id,
    title,
    status,
    created_at,
    jsonb_array_length(route_data->'waypoints') as waypoint_count,
    route_data->'waypoints' as waypoints,
    route_data
FROM experiences 
WHERE route_data IS NOT NULL 
  AND route_data != '{}'::jsonb
  AND jsonb_array_length(route_data->'waypoints') > 0
ORDER BY created_at DESC 
LIMIT 10;

-- Query 1.2: Validate route_data structure for a specific experience
-- Replace '<experience-id>' with actual experience ID
SELECT 
    id,
    title,
    -- Check if waypoints array exists
    CASE 
        WHEN route_data->'waypoints' IS NOT NULL THEN '✅ waypoints array exists'
        ELSE '❌ waypoints array missing'
    END as waypoints_check,
    -- Count waypoints
    jsonb_array_length(route_data->'waypoints') as waypoint_count,
    -- Check if waypoints is an array
    jsonb_typeof(route_data->'waypoints') as waypoints_type,
    -- Show first waypoint structure
    route_data->'waypoints'->0 as first_waypoint_sample
FROM experiences 
WHERE id = '<experience-id>';

-- Query 1.3: Verify waypoint data integrity
-- Checks for required fields and valid coordinate ranges
SELECT 
    id,
    title,
    jsonb_array_length(route_data->'waypoints') as total_waypoints,
    -- Count waypoints with all required fields
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(route_data->'waypoints') wp
     WHERE wp->>'id' IS NOT NULL 
       AND wp->>'lat' IS NOT NULL 
       AND wp->>'lng' IS NOT NULL 
       AND wp->>'name' IS NOT NULL
       AND wp->>'type' IS NOT NULL) as waypoints_with_all_fields,
    -- Count waypoints with valid coordinates (lat: -90 to 90, lng: -180 to 180)
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(route_data->'waypoints') wp
     WHERE (wp->>'lat')::float BETWEEN -90 AND 90
       AND (wp->>'lng')::float BETWEEN -180 AND 180) as waypoints_with_valid_coords,
    -- Count waypoints with valid types
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(route_data->'waypoints') wp
     WHERE wp->>'type' IN ('start', 'stop', 'end')) as waypoints_with_valid_types,
    -- Check for waypoints with missing name (should have name or empty string)
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(route_data->'waypoints') wp
     WHERE wp->>'name' IS NULL) as waypoints_without_name
FROM experiences 
WHERE route_data IS NOT NULL 
  AND route_data != '{}'::jsonb
  AND id = '<experience-id>';

-- Query 1.4: Detailed waypoint breakdown
-- Shows each waypoint with its properties
SELECT 
    id as experience_id,
    title,
    wp.ordinality - 1 as waypoint_index,
    wp.value->>'id' as waypoint_id,
    wp.value->>'name' as waypoint_name,
    wp.value->>'type' as waypoint_type,
    (wp.value->>'lat')::float as latitude,
    (wp.value->>'lng')::float as longitude,
    wp.value->>'description' as description,
    -- Validation checks
    CASE 
        WHEN wp.value->>'id' IS NULL THEN '❌ Missing id'
        WHEN wp.value->>'lat' IS NULL THEN '❌ Missing lat'
        WHEN wp.value->>'lng' IS NULL THEN '❌ Missing lng'
        WHEN wp.value->>'name' IS NULL THEN '⚠️ Missing name'
        WHEN wp.value->>'type' IS NULL THEN '❌ Missing type'
        WHEN (wp.value->>'lat')::float NOT BETWEEN -90 AND 90 THEN '❌ Invalid lat'
        WHEN (wp.value->>'lng')::float NOT BETWEEN -180 AND 180 THEN '❌ Invalid lng'
        WHEN wp.value->>'type' NOT IN ('start', 'stop', 'end') THEN '❌ Invalid type'
        ELSE '✅ Valid'
    END as validation_status
FROM experiences e,
     jsonb_array_elements(e.route_data->'waypoints') WITH ORDINALITY wp
WHERE e.id = '<experience-id>'
ORDER BY wp.ordinality;

-- Query 1.5: Count waypoints per experience
-- Summary view of all experiences with routes
SELECT 
    id,
    title,
    status,
    jsonb_array_length(route_data->'waypoints') as waypoint_count,
    -- Check first waypoint type (should be 'start')
    route_data->'waypoints'->0->>'type' as first_waypoint_type,
    -- Check last waypoint type (should be 'end' if multiple waypoints)
    route_data->'waypoints'->(jsonb_array_length(route_data->'waypoints') - 1)->>'type' as last_waypoint_type,
    created_at
FROM experiences 
WHERE route_data IS NOT NULL 
  AND route_data != '{}'::jsonb
  AND jsonb_array_length(route_data->'waypoints') > 0
ORDER BY created_at DESC;

-- =====================================================
-- Query Set 2: Verify Edited Experience
-- =====================================================

-- Query 2.1: Compare waypoint count before/after edit
-- Note: This requires manual tracking or running query before and after
-- Run this query BEFORE making changes, note the waypoint_count
-- Make your changes, then run Query 2.2 to compare

-- BEFORE EDIT:
SELECT 
    id,
    title,
    updated_at,
    jsonb_array_length(route_data->'waypoints') as waypoint_count_before,
    route_data->'waypoints' as waypoints_before
FROM experiences 
WHERE id = '<experience-id>';

-- Query 2.2: Verify updated waypoints are saved
-- Run this AFTER saving changes
SELECT 
    id,
    title,
    updated_at,
    jsonb_array_length(route_data->'waypoints') as waypoint_count_after,
    route_data->'waypoints' as waypoints_after,
    -- Compare with previous count (manual comparison needed)
    CASE 
        WHEN jsonb_array_length(route_data->'waypoints') > <previous-count> THEN '✅ Waypoints added'
        WHEN jsonb_array_length(route_data->'waypoints') < <previous-count> THEN '✅ Waypoints removed'
        WHEN jsonb_array_length(route_data->'waypoints') = <previous-count> THEN '⚠️ Count unchanged (may have been modified)'
        ELSE '❓ Unknown change'
    END as change_status
FROM experiences 
WHERE id = '<experience-id>';

-- Query 2.3: Verify specific waypoint was added
-- Use this to verify a new waypoint was added with specific coordinates
SELECT 
    id,
    title,
    -- Check if waypoint with specific coordinates exists
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(route_data->'waypoints') wp
            WHERE ABS((wp->>'lat')::float - <expected-lat>) < 0.0001
              AND ABS((wp->>'lng')::float - <expected-lng>) < 0.0001
        ) THEN '✅ Waypoint found at location'
        ELSE '❌ Waypoint not found at location'
    END as waypoint_location_check,
    -- Show waypoint at that location
    (SELECT wp.value
     FROM jsonb_array_elements(route_data->'waypoints') wp
     WHERE ABS((wp->>'lat')::float - <expected-lat>) < 0.0001
       AND ABS((wp->>'lng')::float - <expected-lng>) < 0.0001
     LIMIT 1) as waypoint_at_location
FROM experiences 
WHERE id = '<experience-id>';

-- Query 2.4: Verify waypoint was removed
-- Check that a specific waypoint ID no longer exists
SELECT 
    id,
    title,
    -- Check if waypoint with specific ID exists
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(route_data->'waypoints') wp
            WHERE wp->>'id' = '<waypoint-id-to-check>'
        ) THEN '⚠️ Waypoint still exists (not removed)'
        ELSE '✅ Waypoint removed'
    END as removal_status,
    jsonb_array_length(route_data->'waypoints') as current_waypoint_count
FROM experiences 
WHERE id = '<experience-id>';

-- Query 2.5: Verify waypoint modifications persisted
-- Check that a waypoint's name or coordinates were updated
SELECT 
    id,
    title,
    -- Find waypoint by ID and show its current values
    (SELECT jsonb_build_object(
        'id', wp.value->>'id',
        'name', wp.value->>'name',
        'type', wp.value->>'type',
        'lat', (wp.value->>'lat')::float,
        'lng', (wp.value->>'lng')::float
    )
     FROM jsonb_array_elements(route_data->'waypoints') wp
     WHERE wp->>'id' = '<waypoint-id-to-check>'
     LIMIT 1) as current_waypoint_data
FROM experiences 
WHERE id = '<experience-id>';

-- =====================================================
-- Query Set 3: Verify Moderator View
-- =====================================================

-- Query 3.1: Find experiences with route_data for moderator review
-- Use this to find experiences that should show route visualization
SELECT 
    id,
    title,
    status,
    experience_domain,
    neighborhood,
    jsonb_array_length(route_data->'waypoints') as waypoint_count,
    -- Check if route_data has valid structure for display
    CASE 
        WHEN route_data->'waypoints' IS NOT NULL 
         AND jsonb_array_length(route_data->'waypoints') > 0 THEN '✅ Should display route'
        WHEN route_data IS NULL OR route_data = '{}'::jsonb THEN 'ℹ️ No route data'
        WHEN route_data->'waypoints' = '[]'::jsonb THEN 'ℹ️ Empty waypoints array'
        ELSE '⚠️ Invalid structure'
    END as display_status,
    created_at,
    updated_at
FROM experiences 
WHERE status IN ('submitted', 'approved', 'draft')
ORDER BY updated_at DESC;

-- Query 3.2: Validate route_data structure matches frontend expectations
-- Checks that data structure matches what frontend normalizer expects
SELECT 
    id,
    title,
    -- Check waypoints array exists and is not empty
    CASE 
        WHEN route_data->'waypoints' IS NOT NULL 
         AND jsonb_array_length(route_data->'waypoints') > 0 THEN '✅ Has waypoints'
        ELSE '❌ No waypoints'
    END as waypoints_check,
    -- Verify each waypoint has required fields for frontend
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(route_data->'waypoints') wp
     WHERE wp->>'id' IS NOT NULL 
       AND wp->>'lat' IS NOT NULL 
       AND wp->>'lng' IS NOT NULL) as valid_waypoint_count,
    jsonb_array_length(route_data->'waypoints') as total_waypoint_count,
    -- Check if structure matches expected format
    CASE 
        WHEN jsonb_typeof(route_data->'waypoints') = 'array' THEN '✅ Correct type (array)'
        ELSE '❌ Wrong type'
    END as structure_check
FROM experiences 
WHERE route_data IS NOT NULL 
  AND route_data != '{}'::jsonb
  AND id = '<experience-id>';

-- Query 3.3: Check for data inconsistencies
-- Finds potential issues that might cause display problems
SELECT 
    id,
    title,
    -- Waypoints with missing or empty names
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(route_data->'waypoints') wp
     WHERE wp->>'name' IS NULL OR wp->>'name' = '') as waypoints_without_name,
    -- Waypoints with invalid coordinates
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(route_data->'waypoints') wp
     WHERE (wp->>'lat')::float NOT BETWEEN -90 AND 90
        OR (wp->>'lng')::float NOT BETWEEN -180 AND 180) as waypoints_invalid_coords,
    -- Waypoints with invalid types
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(route_data->'waypoints') wp
     WHERE wp->>'type' NOT IN ('start', 'stop', 'end')) as waypoints_invalid_type,
    -- Check if first waypoint is start
    CASE 
        WHEN route_data->'waypoints'->0->>'type' = 'start' THEN '✅ First is start'
        ELSE '⚠️ First waypoint is not start'
    END as first_waypoint_check,
    -- Check if last waypoint is end (if multiple waypoints)
    CASE 
        WHEN jsonb_array_length(route_data->'waypoints') > 1
         AND route_data->'waypoints'->(jsonb_array_length(route_data->'waypoints') - 1)->>'type' = 'end' 
        THEN '✅ Last is end'
        WHEN jsonb_array_length(route_data->'waypoints') = 1 THEN 'ℹ️ Single waypoint'
        ELSE '⚠️ Last waypoint is not end'
    END as last_waypoint_check
FROM experiences 
WHERE route_data IS NOT NULL 
  AND route_data != '{}'::jsonb
  AND id = '<experience-id>';

-- Query 3.4: Sample route_data for moderator review
-- Shows a clean view of route_data that moderator should see
SELECT 
    id,
    title,
    status,
    jsonb_array_length(route_data->'waypoints') as waypoint_count,
    -- Format waypoints for easy reading
    jsonb_pretty(route_data->'waypoints') as waypoints_formatted,
    -- Show first waypoint location (for map centering)
    jsonb_build_object(
        'lat', (route_data->'waypoints'->0->>'lat')::float,
        'lng', (route_data->'waypoints'->0->>'lng')::float,
        'name', route_data->'waypoints'->0->>'name'
    ) as first_waypoint_location
FROM experiences 
WHERE route_data IS NOT NULL 
  AND route_data != '{}'::jsonb
  AND jsonb_array_length(route_data->'waypoints') > 0
  AND id = '<experience-id>';

-- =====================================================
-- Query Set 4: General Verification Queries
-- =====================================================

-- Query 4.1: Statistics - Experiences with vs without routes
SELECT 
    'Total experiences' as metric,
    COUNT(*) as count
FROM experiences
UNION ALL
SELECT 
    'Experiences with route_data',
    COUNT(*)
FROM experiences 
WHERE route_data IS NOT NULL 
  AND route_data != '{}'::jsonb
  AND jsonb_array_length(route_data->'waypoints') > 0
UNION ALL
SELECT 
    'Experiences without route_data',
    COUNT(*)
FROM experiences 
WHERE route_data IS NULL 
   OR route_data = '{}'::jsonb
   OR jsonb_array_length(route_data->'waypoints') = 0;

-- Query 4.2: Average waypoints per route
SELECT 
    'Average waypoints per route' as metric,
    ROUND(AVG(jsonb_array_length(route_data->'waypoints'))::numeric, 2) as value,
    MIN(jsonb_array_length(route_data->'waypoints')) as min_waypoints,
    MAX(jsonb_array_length(route_data->'waypoints')) as max_waypoints
FROM experiences 
WHERE route_data IS NOT NULL 
  AND route_data != '{}'::jsonb
  AND jsonb_array_length(route_data->'waypoints') > 0;

-- Query 4.3: Recent route_data updates
-- Find experiences that were recently updated with route_data
SELECT 
    id,
    title,
    status,
    updated_at,
    created_at,
    jsonb_array_length(route_data->'waypoints') as waypoint_count,
    CASE 
        WHEN updated_at > created_at THEN '✅ Updated after creation'
        ELSE 'ℹ️ Not updated'
    END as update_status
FROM experiences 
WHERE route_data IS NOT NULL 
  AND route_data != '{}'::jsonb
  AND jsonb_array_length(route_data->'waypoints') > 0
ORDER BY updated_at DESC 
LIMIT 20;

-- =====================================================
-- Usage Instructions
-- =====================================================

-- 1. Replace '<experience-id>' with actual experience ID from your tests
-- 2. Replace '<waypoint-id-to-check>' with actual waypoint ID when checking specific waypoints
-- 3. Replace '<expected-lat>' and '<expected-lng>' with expected coordinates
-- 4. Replace '<previous-count>' with the waypoint count before making changes
-- 5. Run queries in Supabase SQL Editor
-- 6. Compare results with expected values from test checklist
-- 7. Document any discrepancies in test results

-- Expected Results:
-- - All validation checks should show ✅
-- - Waypoint counts should match what you added/removed
-- - Data structure should match frontend expectations
-- - No invalid coordinates or missing required fields

