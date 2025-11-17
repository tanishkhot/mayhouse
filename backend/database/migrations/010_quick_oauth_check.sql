-- =====================================================
-- Quick OAuth Setup Check
-- =====================================================
-- Run this to quickly verify all OAuth migration components
-- =====================================================

-- Check 1: auth_provider column exists
SELECT 
    'auth_provider column' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'auth_provider'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- Check 2: Email index exists
SELECT 
    'Email index' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'users' AND indexname = 'idx_users_email'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- Check 3: Table comment exists
SELECT 
    'Table comment' as check_name,
    CASE 
        WHEN obj_description('users'::regclass, 'pg_class') IS NOT NULL 
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- Check 4: Count of OAuth users
SELECT 
    'OAuth users count' as check_name,
    COUNT(*)::text || ' users found' as status
FROM users 
WHERE email IS NOT NULL 
  AND (wallet_address IS NULL OR auth_provider = 'oauth');

-- Summary: All checks should show ✅ EXISTS or a count
-- If any show ❌ MISSING, the migration may not have completed fully

