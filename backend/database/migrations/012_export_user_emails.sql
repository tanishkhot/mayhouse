-- =====================================================
-- Export User Emails - Simple Format
-- =====================================================
-- Run this to get a clean list of all user emails
-- =====================================================

-- Simple email list (easiest to copy)
SELECT 
    email,
    full_name,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as signed_up_date
FROM users 
WHERE email IS NOT NULL
ORDER BY created_at DESC;

-- If you want just emails (one column, easy to copy):
-- SELECT email FROM users WHERE email IS NOT NULL ORDER BY email;

