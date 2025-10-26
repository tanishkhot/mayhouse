-- =====================================================
-- ADMIN USER CREATION SCRIPT
-- =====================================================
-- This script creates or updates a user with admin role
-- Use this to grant admin access to the /moderator dashboard

-- Note: "Moderator" is just the dashboard name - only admin role exists

-- =====================================================
-- OPTION 1: Create Admin by Wallet Address
-- =====================================================
-- Use this for Web3 wallet authentication

-- Make specific wallet address an admin
INSERT INTO public.users (
    wallet_address,
    role,
    full_name,
    created_at,
    updated_at
) VALUES (
    '0x037ce9723e75a088d8d1A9c188cf359425a21666',  -- Replace with actual wallet address
    'admin',
    'Platform Admin',
    NOW(),
    NOW()
) 
ON CONFLICT (wallet_address) 
DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- Verify the admin was created/updated
SELECT id, wallet_address, email, role, full_name, created_at 
FROM public.users 
WHERE wallet_address = '0x037ce9723e75a088d8d1A9c188cf359425a21666';


-- =====================================================
-- OPTION 2: Update Existing User to Admin by Email
-- =====================================================
-- Use this if user already exists and you want to promote them

-- UPDATE public.users 
-- SET role = 'admin', updated_at = NOW()
-- WHERE email = 'admin@example.com';  -- Replace with actual email

-- Verify
-- SELECT id, email, wallet_address, role, full_name, created_at 
-- FROM public.users 
-- WHERE email = 'admin@example.com';


-- =====================================================
-- OPTION 3: Update Existing User to Admin by User ID
-- =====================================================
-- Use this if you have the user's ID

-- UPDATE public.users 
-- SET role = 'admin', updated_at = NOW()
-- WHERE id = '00000000-0000-4000-8000-000000000002';  -- Replace with actual user ID

-- Verify
-- SELECT id, email, wallet_address, role, full_name, created_at 
-- FROM public.users 
-- WHERE id = '00000000-0000-4000-8000-000000000002';


-- =====================================================
-- BULK OPERATIONS
-- =====================================================

-- List all admins
SELECT id, email, wallet_address, role, full_name, created_at 
FROM public.users 
WHERE role = 'admin'
ORDER BY created_at DESC;


-- Revoke admin access (downgrade to user)
-- UPDATE public.users 
-- SET role = 'user', updated_at = NOW()
-- WHERE wallet_address = '0x...';  -- Replace with wallet address


-- Revoke admin access (downgrade to host)
-- UPDATE public.users 
-- SET role = 'host', updated_at = NOW()
-- WHERE wallet_address = '0x...';  -- Replace with wallet address


-- =====================================================
-- ROLE INFORMATION
-- =====================================================
-- Available roles in the system:
--   - 'user': Basic user access
--   - 'host': Can create experiences and event runs
--   - 'admin': Full system access (includes /moderator dashboard)

-- Moderator Dashboard (/moderator page):
--   - Only 'admin' role can access /moderator page
--   - "Moderator" is just the page name, not a separate role


-- =====================================================
-- NOTES
-- =====================================================
-- 1. Admins can:
--    - Access /moderator dashboard
--    - Review host applications
--    - Approve/reject experiences
--    - View all event runs and bookings
--    - Manage users (future feature)
--    - System configuration (future feature)
--
-- 2. Security:
--    - Frontend checks role via JWT token
--    - Backend validates role on every request
--    - Role is stored in database, not in token payload alone
--
-- 3. After running this script:
--    - User must re-login to get updated role in JWT token
--    - Old tokens may still have old role cached
--    - Clear browser localStorage if needed


