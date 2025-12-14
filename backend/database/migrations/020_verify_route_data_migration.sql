-- =====================================================
-- Verification: Check Route Data Migration
-- =====================================================
-- Run this to verify migration 019_add_route_data_to_experiences.sql was applied correctly
-- =====================================================

-- Check 1: route_data column exists
SELECT 
    'route_data column' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'experiences' AND column_name = 'route_data'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- Check 2: route_data column data type is JSONB
SELECT 
    'route_data data type' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'experiences' 
            AND column_name = 'route_data' 
            AND data_type = 'jsonb'
        ) THEN '✅ JSONB'
        ELSE '❌ WRONG TYPE'
    END as status;

-- Check 3: route_data default value is '{}'::jsonb
SELECT 
    'route_data default value' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'experiences' 
            AND column_name = 'route_data' 
            AND column_default = '''{}''::jsonb'
        ) THEN '✅ DEFAULT {}'
        ELSE '⚠️  CHECK DEFAULT'
    END as status;

-- Check 4: Column comment exists
SELECT 
    'route_data column comment' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_catalog.pg_description d
            JOIN pg_catalog.pg_class c ON d.objoid = c.oid
            JOIN pg_catalog.pg_attribute a ON d.objoid = a.attrelid AND d.objsubid = a.attnum
            WHERE c.relname = 'experiences' 
            AND a.attname = 'route_data'
            AND d.description IS NOT NULL
        ) THEN '✅ EXISTS'
        ELSE '⚠️  MISSING COMMENT'
    END as status;

-- Check 5: Detailed column information
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable,
    CASE 
        WHEN data_type = 'jsonb' THEN '✅'
        ELSE '❌'
    END as type_check
FROM information_schema.columns 
WHERE table_name = 'experiences' 
  AND column_name = 'route_data';

-- Check 6: Count experiences with route_data
SELECT 
    'Experiences with route_data' as check_name,
    COUNT(*)::text || ' experiences found' as status
FROM experiences 
WHERE route_data IS NOT NULL 
  AND route_data != '{}'::jsonb;

-- Check 7: Sample route_data (if any exists)
SELECT 
    'Sample route_data' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM experiences 
            WHERE route_data IS NOT NULL 
            AND route_data != '{}'::jsonb
        ) THEN '✅ DATA FOUND'
        ELSE 'ℹ️  NO DATA YET (expected for new migration)'
    END as status;

-- Check 8: Show sample route_data structure (if any exists)
SELECT 
    id,
    title,
    route_data,
    CASE 
        WHEN route_data->'waypoints' IS NOT NULL THEN 
            jsonb_array_length(route_data->'waypoints')::text || ' waypoints'
        ELSE 'No waypoints'
    END as waypoint_count
FROM experiences 
WHERE route_data IS NOT NULL 
  AND route_data != '{}'::jsonb
LIMIT 5;

-- Summary: All checks should show ✅ EXISTS or ✅ JSONB
-- If any show ❌ MISSING or ❌ WRONG TYPE, the migration may not have completed fully
-- If Check 7 shows "NO DATA YET", that's expected for a new migration

