# Auth Provider Classification Guide

## Overview

Users are now properly classified based on how they signed in:
- **`google_oauth`**: Signed in via Google OAuth
- **`wallet`**: Signed in via wallet (Web3)
- **`email`**: Signed in via email/password
- **`mixed`**: Has both email and wallet (signed in with both methods)

## Migration Steps

### Step 1: Run the Classification Migration

Run `013_fix_auth_provider_classification.sql` in Supabase SQL Editor:

```sql
-- This will properly classify all existing users
```

This migration will:
1. Classify Google OAuth users (has email + google_id/primary_oauth_provider)
2. Classify wallet users (has wallet_address, no email)
3. Classify mixed users (has both email and wallet)
4. Classify email/password users (has email, no google_id, no wallet)

### Step 2: Verify Classification

Run `014_view_user_signin_methods.sql` to see the breakdown:

```sql
-- Shows summary by sign-in method
SELECT 
    auth_provider,
    COUNT(*) as total_users
FROM users 
GROUP BY auth_provider;
```

## Classification Rules

### Google OAuth Users
- Has `email` (not null)
- Has `google_id` OR `primary_oauth_provider = 'google'`
- No `wallet_address` (or null)
- **auth_provider**: `'google_oauth'`

### Wallet Users
- Has `wallet_address` (not null)
- No `email` (or null)
- **auth_provider**: `'wallet'`

### Email/Password Users
- Has `email` (not null)
- No `google_id`
- `primary_oauth_provider` is null or not 'google'
- No `wallet_address`
- **auth_provider**: `'email'`

### Mixed Users
- Has both `email` and `wallet_address`
- **auth_provider**: `'mixed'`

## Code Updates

### OAuth Service (`oauth_service.py`)
- Now sets `auth_provider = 'google_oauth'` when creating users
- Stores `google_id`, `primary_oauth_provider`, and `oauth_profile_data`
- Updates existing users to proper classification

### Wallet Service (`wallet_service.py`)
- Now sets `auth_provider = 'wallet'` when creating users
- Properly classifies wallet-only users

## Query Examples

### Get all Google OAuth users
```sql
SELECT email, full_name, created_at
FROM users 
WHERE auth_provider = 'google_oauth'
ORDER BY created_at DESC;
```

### Get all wallet users
```sql
SELECT wallet_address, full_name, created_at
FROM users 
WHERE auth_provider = 'wallet'
ORDER BY created_at DESC;
```

### Get sign-in method breakdown
```sql
SELECT 
    auth_provider,
    COUNT(*) as count
FROM users 
GROUP BY auth_provider;
```

## After Migration

After running the migration, you should see:
- Most users with email → `google_oauth`
- Users with wallet only → `wallet`
- Users with both → `mixed`
- Very few → `email` (if any email/password signups exist)

## Future Sign-Ins

New users will be automatically classified correctly:
- Google OAuth sign-ins → `auth_provider = 'google_oauth'`
- Wallet sign-ins → `auth_provider = 'wallet'`

No manual classification needed going forward!

