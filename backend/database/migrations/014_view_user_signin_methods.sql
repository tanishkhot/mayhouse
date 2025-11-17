-- =====================================================
-- View: User Sign-In Methods Summary
-- =====================================================
-- This query shows a clear breakdown of how users signed in
-- =====================================================

-- Summary by sign-in method
SELECT 
    auth_provider,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN role = 'host' THEN 1 END) as hosts,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users
FROM users 
GROUP BY auth_provider
ORDER BY total_users DESC;

-- Detailed list with sign-in method
SELECT 
    id,
    email,
    wallet_address,
    full_name,
    role,
    auth_provider,
    CASE 
        WHEN auth_provider = 'google_oauth' THEN '✅ Google OAuth'
        WHEN auth_provider = 'wallet' THEN '✅ Wallet'
        WHEN auth_provider = 'email' THEN '✅ Email/Password'
        WHEN auth_provider = 'mixed' THEN '✅ Both (Email + Wallet)'
        ELSE '❓ Unknown'
    END as sign_in_method,
    google_id,
    primary_oauth_provider,
    created_at as signed_up_at
FROM users 
ORDER BY created_at DESC;

-- Quick email list by sign-in method (all in one query)
-- Note: ORDER BY must be at the end, not in individual SELECTs
SELECT 
    'Google OAuth Users' as category,
    email,
    full_name,
    created_at
FROM users 
WHERE auth_provider = 'google_oauth'

UNION ALL

SELECT 
    'Wallet Users' as category,
    COALESCE(email, 'No email') as email,
    full_name,
    created_at
FROM users 
WHERE auth_provider = 'wallet'

UNION ALL

SELECT 
    'Email/Password Users' as category,
    email,
    full_name,
    created_at
FROM users 
WHERE auth_provider = 'email'

UNION ALL

SELECT 
    'Mixed (Email + Wallet)' as category,
    email,
    full_name,
    created_at
FROM users 
WHERE auth_provider = 'mixed'

ORDER BY category, created_at DESC;

-- Alternative: Separate queries for each category (run individually if needed)
-- Google OAuth Users
-- SELECT email, full_name, created_at
-- FROM users 
-- WHERE auth_provider = 'google_oauth'
-- ORDER BY created_at DESC;

-- Wallet Users
-- SELECT COALESCE(email, 'No email') as email, full_name, created_at
-- FROM users 
-- WHERE auth_provider = 'wallet'
-- ORDER BY created_at DESC;

-- Email/Password Users
-- SELECT email, full_name, created_at
-- FROM users 
-- WHERE auth_provider = 'email'
-- ORDER BY created_at DESC;

-- Mixed Users
-- SELECT email, full_name, created_at
-- FROM users 
-- WHERE auth_provider = 'mixed'
-- ORDER BY created_at DESC;

