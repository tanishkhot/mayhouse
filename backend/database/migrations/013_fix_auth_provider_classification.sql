-- =====================================================
-- Fix Auth Provider Classification
-- =====================================================
-- This migration properly classifies users based on how they signed in:
-- - 'google_oauth': Signed in via Google OAuth (has email, google_id or primary_oauth_provider)
-- - 'wallet': Signed in via wallet (has wallet_address, no email)
-- - 'email': Signed in via email/password (has email, no google_id, no wallet)
-- - 'mixed': Has both email and wallet (rare)
-- =====================================================

-- Step 1: Classify Google OAuth users
-- Users with email AND (google_id OR primary_oauth_provider = 'google') AND no wallet
UPDATE users 
SET auth_provider = 'google_oauth'
WHERE email IS NOT NULL 
  AND (google_id IS NOT NULL OR primary_oauth_provider = 'google')
  AND (wallet_address IS NULL OR wallet_address = '');

-- Step 2: Classify wallet users
-- Users with wallet_address and no email (or email is null)
UPDATE users 
SET auth_provider = 'wallet'
WHERE wallet_address IS NOT NULL 
  AND wallet_address != ''
  AND (email IS NULL OR email = '');

-- Step 3: Classify mixed users (have both email and wallet)
-- These are users who signed in with both methods
UPDATE users 
SET auth_provider = 'mixed'
WHERE email IS NOT NULL 
  AND email != ''
  AND wallet_address IS NOT NULL 
  AND wallet_address != '';

-- Step 4: Handle edge cases - users with email but unclear classification
-- Since Google OAuth is the primary OAuth method, classify users with email 
-- (and no wallet) as 'google_oauth' by default if they don't have explicit 
-- email/password signup evidence
-- This catches users who signed in via OAuth but google_id wasn't stored
UPDATE users 
SET auth_provider = 'google_oauth'
WHERE email IS NOT NULL 
  AND email != ''
  AND wallet_address IS NULL
  AND (auth_provider = 'oauth' OR auth_provider = 'email')
  AND google_id IS NULL
  AND (primary_oauth_provider IS NULL OR primary_oauth_provider != 'google');

-- Step 5: Classify email/password users (only if we have explicit evidence)
-- Note: In this system, email/password signup is rare, so this will likely 
-- match very few or no users. Most email users are actually Google OAuth users
-- where google_id wasn't stored.
-- UPDATE users 
-- SET auth_provider = 'email'
-- WHERE email IS NOT NULL 
--   AND email != ''
--   AND google_id IS NULL
--   AND (primary_oauth_provider IS NULL OR primary_oauth_provider != 'google')
--   AND (wallet_address IS NULL OR wallet_address = '')
--   AND auth_provider NOT IN ('google_oauth', 'mixed');
-- Note: Commented out since we don't have email/password signup in this system

-- =====================================================
-- Verification Queries (Run separately if needed)
-- =====================================================
-- Note: Run these queries separately to verify the classification
-- They are commented out to avoid syntax errors when running all at once

-- Count by auth provider
-- SELECT 
--     auth_provider,
--     COUNT(*) as user_count
-- FROM users 
-- GROUP BY auth_provider
-- ORDER BY user_count DESC;

