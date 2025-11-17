-- =====================================================
-- Reclassify OAuth Users (Fix for misclassified users)
-- =====================================================
-- This fixes users who were incorrectly classified as 'email' 
-- but actually signed in via Google OAuth
-- =====================================================

-- Reclassify users with email (no wallet) as Google OAuth
-- These are users who signed in via Google OAuth but google_id wasn't stored
UPDATE users 
SET auth_provider = 'google_oauth'
WHERE email IS NOT NULL 
  AND email != ''
  AND wallet_address IS NULL
  AND auth_provider = 'email'
  AND google_id IS NULL
  AND (primary_oauth_provider IS NULL OR primary_oauth_provider != 'google');

-- Verify the fix
SELECT 
    auth_provider,
    COUNT(*) as user_count
FROM users 
GROUP BY auth_provider
ORDER BY user_count DESC;

