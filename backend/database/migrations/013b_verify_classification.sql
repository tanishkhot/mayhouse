-- =====================================================
-- Verification: Check Classification Results
-- =====================================================
-- Run this AFTER running 013_fix_auth_provider_classification.sql
-- to verify the classification worked correctly
-- =====================================================

-- Count by auth provider
SELECT 
    auth_provider,
    COUNT(*) as user_count
FROM users 
GROUP BY auth_provider
ORDER BY user_count DESC;

-- Show sample users from each category (one query per category)
-- Google OAuth users
SELECT 
    'google_oauth' as category,
    id,
    email,
    full_name,
    google_id,
    primary_oauth_provider,
    wallet_address,
    auth_provider
FROM users 
WHERE auth_provider = 'google_oauth'
LIMIT 5;

-- Wallet users
SELECT 
    'wallet' as category,
    id,
    email,
    full_name,
    google_id,
    primary_oauth_provider,
    wallet_address,
    auth_provider
FROM users 
WHERE auth_provider = 'wallet'
LIMIT 5;

-- Mixed users (email + wallet)
SELECT 
    'mixed' as category,
    id,
    email,
    full_name,
    google_id,
    primary_oauth_provider,
    wallet_address,
    auth_provider
FROM users 
WHERE auth_provider = 'mixed'
LIMIT 5;

-- Email/password users
SELECT 
    'email' as category,
    id,
    email,
    full_name,
    google_id,
    primary_oauth_provider,
    wallet_address,
    auth_provider
FROM users 
WHERE auth_provider = 'email'
LIMIT 5;

