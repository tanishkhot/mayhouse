-- =====================================================
-- Verification: Check OAuth User Setup
-- =====================================================
-- Run this to verify the OAuth migration was applied correctly
-- =====================================================

-- 1. Check if auth_provider column exists
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'auth_provider';

-- 2. Check if email index exists
SELECT 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'users' 
  AND indexname = 'idx_users_email';

-- 3. Check existing OAuth users (users with email but no wallet)
SELECT 
    id, 
    email, 
    full_name, 
    auth_provider,
    wallet_address,
    created_at
FROM users 
WHERE email IS NOT NULL 
  AND (wallet_address IS NULL OR auth_provider = 'oauth')
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check table comment was added
SELECT 
    obj_description('users'::regclass, 'pg_class') as table_comment;

-- Expected Results:
-- 1. Should show auth_provider column with default 'oauth'
-- 2. Should show idx_users_email index
-- 3. Should list OAuth users (if any exist)
-- 4. Should show the table comment about OAuth linking

