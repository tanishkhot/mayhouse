# User to Host Migration Guide

## Overview

Since we're only onboarding hosts for the first 6 months, all users need to be converted to hosts to access the design-experience endpoint and create experiences.

## Migration Steps

### Step 1: Run the Migration

Run `015_convert_users_to_hosts.sql` in Supabase SQL Editor:

```sql
-- This converts all existing users (except admins) to hosts
UPDATE users 
SET role = 'host',
    updated_at = NOW()
WHERE role = 'user'
  AND role != 'admin';
```

This will:
- Convert all users with role 'user' to 'host'
- Keep admins unchanged
- Update the `updated_at` timestamp

### Step 2: Verify the Conversion

After running the migration, check the results:

```sql
SELECT 
    role,
    COUNT(*) as user_count
FROM users 
GROUP BY role;
```

You should see:
- Most users as 'host'
- Admins remain 'admin'
- No 'user' roles (or very few if any)

## Code Updates

### OAuth Service (`oauth_service.py`)

**New Users:**
- New Google OAuth users are automatically created with `role = 'host'`

**Existing Users:**
- When existing users sign in via Google OAuth, they're automatically upgraded from 'user' to 'host' (unless they're already admin)

## What This Fixes

### Before Migration:
- Users with role 'user' → ❌ Cannot access design-experience endpoint
- Error: "Access denied: Host role required"

### After Migration:
- All users converted to 'host' → ✅ Can access design-experience endpoint
- Can create experiences
- Can use all host features

## Endpoints Now Accessible

After conversion, users can access:
- ✅ `POST /design-experience/session` - Start design session
- ✅ `POST /design-experience/generate` - Generate experience from description
- ✅ `PATCH /design-experience/session/{id}/basics` - Update basics
- ✅ `POST /design-experience/session/{id}/media` - Upload media
- ✅ `PATCH /design-experience/session/{id}/logistics` - Update logistics
- ✅ `GET /design-experience/session/{id}/review` - Get review
- ✅ `POST /design-experience/session/{id}/submit` - Submit experience
- ✅ `POST /experiences` - Create experience
- ✅ `GET /experiences/my` - Get my experiences

## Testing

1. Run the migration
2. Sign in with Google OAuth
3. Try accessing `/design-experience` page
4. Should work without "Access denied" errors

## Future Changes

After 6 months, when you start onboarding regular users:
- Update OAuth service to create new users as 'user' by default
- Add host application flow for users who want to become hosts
- Keep the migration for reference

