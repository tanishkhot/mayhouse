-- =====================================================
-- List All User Emails and Sign-In Information
-- =====================================================
-- This query shows all users who have signed in,
-- with their email addresses and authentication details
-- =====================================================

-- Option 1: Simple list of all emails
SELECT 
    email,
    full_name,
    auth_provider,
    created_at as signed_up_at
FROM users 
WHERE email IS NOT NULL
ORDER BY created_at DESC;

-- Option 2: Detailed view with all user info
SELECT 
    id,
    email,
    full_name,
    username,
    auth_provider,
    CASE 
        WHEN wallet_address IS NOT NULL THEN 'Has Wallet'
        ELSE 'No Wallet'
    END as wallet_status,
    role,
    created_at as signed_up_at,
    updated_at as last_updated
FROM users 
WHERE email IS NOT NULL
ORDER BY created_at DESC;

-- Option 3: Count by authentication method
SELECT 
    auth_provider,
    COUNT(*) as user_count
FROM users 
WHERE email IS NOT NULL
GROUP BY auth_provider
ORDER BY user_count DESC;

-- Option 4: Export-friendly format (CSV-like)
SELECT 
    email || ',' || 
    COALESCE(full_name, '') || ',' || 
    COALESCE(auth_provider, 'unknown') || ',' ||
    created_at::text
FROM users 
WHERE email IS NOT NULL
ORDER BY created_at DESC;

-- Option 5: Just emails (one per line, easy to copy)
SELECT email
FROM users 
WHERE email IS NOT NULL
ORDER BY email ASC;

