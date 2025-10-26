-- =============================================
-- UPDATE ALL USERS TO HOST ROLE
-- =============================================
-- This script updates all existing users to have the "host" role
-- so they can create and manage experiences

-- Update all users in the public.users table
UPDATE public.users 
SET role = 'host',
    updated_at = NOW()
WHERE role = 'user' OR role IS NULL;

-- Verify the changes
SELECT 
    id,
    wallet_address,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM public.users 
ORDER BY created_at DESC
LIMIT 50;

-- Count users by role
SELECT 
    role,
    COUNT(*) as count
FROM public.users
GROUP BY role;



