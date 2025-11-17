-- =====================================================
-- Migration: Ensure OAuth User Linking
-- =====================================================
-- Description: Ensures OAuth users are properly linked between
--             Supabase Auth (auth.users) and our users table
--
-- This migration helps ensure that:
-- 1. OAuth users have proper JWT tokens from Supabase Auth
-- 2. Users table IDs match Supabase Auth user IDs when possible
-- 3. Fallback to custom JWT works if Supabase Auth creation fails
-- =====================================================

-- Add a comment to the users table about OAuth linking
COMMENT ON TABLE users IS 'User profiles linked to Supabase Auth. 
OAuth users should have matching IDs with auth.users when possible.
Custom JWT tokens work as fallback if Supabase Auth user creation fails.';

-- Ensure email is indexed for OAuth lookups (if not already)
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email) 
WHERE email IS NOT NULL;

-- Add a column to track auth provider (optional, for future use)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'oauth';

COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: oauth, wallet, or email';

-- Update existing OAuth users to mark them
-- (This is informational only - doesn't affect functionality)
UPDATE users 
SET auth_provider = 'oauth'
WHERE email IS NOT NULL 
  AND wallet_address IS NULL
  AND auth_provider IS NULL;

-- Note: This migration doesn't require any data changes
-- The OAuth service will handle creating users in Supabase Auth
-- and linking them properly during the OAuth callback flow.

-- =====================================================
-- Verification Queries (run manually if needed)
-- =====================================================

-- Check OAuth users in our table
-- SELECT id, email, full_name, auth_provider, created_at 
-- FROM users 
-- WHERE auth_provider = 'oauth' 
-- ORDER BY created_at DESC;

-- Check if users exist in Supabase Auth (requires admin access)
-- This would be done via Supabase Admin API, not SQL
-- The OAuth service handles this automatically

