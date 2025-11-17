-- =====================================================
-- Convert Users to Hosts
-- =====================================================
-- Since we're only onboarding hosts for the first 6 months,
-- convert all existing users (except admins) to hosts
-- =====================================================

-- Convert all users with role 'user' to 'host'
-- Keep admins as they are
UPDATE users 
SET role = 'host',
    updated_at = NOW()
WHERE role = 'user'
  AND role != 'admin';

-- Verify the conversion
SELECT 
    role,
    COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY user_count DESC;

-- Show sample converted users
SELECT 
    id,
    email,
    full_name,
    role,
    auth_provider,
    created_at,
    updated_at
FROM users 
WHERE role = 'host'
ORDER BY updated_at DESC
LIMIT 10;

