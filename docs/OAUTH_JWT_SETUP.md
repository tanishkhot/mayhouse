# OAuth JWT Token Setup Guide

## Current Implementation

When users sign in with Google OAuth:

1. **User signs in via Google** → `/auth/oauth/google/login`
2. **Google redirects back** → `/auth/oauth/google/callback`
3. **Backend creates/gets user** in `users` table
4. **Backend creates JWT token** using `create_supabase_session_token()`
5. **Token is returned to frontend** in redirect URL
6. **Frontend stores token** and uses it for API calls

## How JWT Tokens Work

### Custom JWT Tokens (Current Implementation)

The OAuth service creates **custom JWT tokens** that:
- Are signed with `JWT_SECRET_KEY` from `.env`
- Contain user ID, email, and role
- Are validated by the middleware's custom JWT validator
- Work perfectly for API authentication

**Token Structure:**
```json
{
  "sub": "user-id-from-database",
  "email": "user@example.com",
  "role": "user",
  "exp": 1234567890
}
```

### Token Validation Flow

1. Middleware receives request with `Authorization: Bearer <token>`
2. First tries Supabase Auth validation (for users created via Supabase Auth)
3. If that fails, tries custom JWT validation (for OAuth users)
4. Extracts user ID from token
5. Looks up user in `users` table
6. Returns user data

## Database Setup

### Migration: `008_ensure_oauth_user_linking.sql`

This migration:
- Adds `auth_provider` column to track authentication method
- Adds index on email for faster OAuth lookups
- Documents the OAuth user linking process

**To run:**
```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f backend/database/migrations/008_ensure_oauth_user_linking.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `008_ensure_oauth_user_linking.sql`
3. Run the query

## How It Works

### For New OAuth Users:

1. User signs in with Google
2. Backend receives Google user info
3. Backend tries to create user in Supabase Auth (optional, for better integration)
4. Backend creates user in `users` table
5. Backend creates custom JWT token
6. Token is returned to frontend

### For Existing OAuth Users:

1. User signs in with Google
2. Backend finds user by email in `users` table
3. Backend ensures user exists in Supabase Auth (if possible)
4. Backend creates new JWT token
5. Token is returned to frontend

## Token Assignment

**JWT tokens ARE being assigned!** Here's the flow:

```python
# In oauth_service.py -> create_supabase_session_token()
token_data = {
    "sub": user["id"],      # User ID from database
    "email": user.get("email"),
    "role": user.get("role", "user"),
}
access_token = create_access_token(token_data, expires_delta)
# Returns JWT token string
```

```python
# In oauth.py -> google_oauth_callback()
access_token = await create_supabase_session_token(user)
redirect_url = f"{frontend_url}/auth/callback#access_token={access_token}&token_type=bearer"
# Token is sent to frontend in URL hash
```

## Frontend Token Handling

The frontend should:
1. Extract token from URL hash: `#access_token=...`
2. Store token in localStorage or sessionStorage
3. Include token in API requests: `Authorization: Bearer <token>`

## Verification

To verify JWT tokens are working:

### 1. Check Token Creation
```bash
# After OAuth sign-in, check browser console for token in URL
# Should see: /auth/callback#access_token=eyJ...
```

### 2. Test API Call
```bash
# Use the token in an API call
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Check Token Payload
You can decode the JWT token (without verification) at https://jwt.io to see:
- User ID (`sub`)
- Email
- Role
- Expiration time

## Troubleshooting

### "Invalid or expired token" error

**Possible causes:**
1. Token not being sent in `Authorization` header
2. Token expired (default: 7 days)
3. `JWT_SECRET_KEY` changed (invalidates all tokens)
4. Token format incorrect

**Solutions:**
- Check frontend is sending `Authorization: Bearer <token>`
- Check token hasn't expired
- Ensure `JWT_SECRET_KEY` in `.env` matches what was used to create token
- Verify token format: should start with `eyJ`

### "User not found" error

**Possible causes:**
1. User ID in token doesn't match database
2. User was deleted from database
3. Database connection issue

**Solutions:**
- Check user exists in `users` table with matching ID
- Verify database connection
- Check user ID in token matches database ID

### Token not being created

**Check:**
1. OAuth callback is being called
2. `create_supabase_session_token()` is being called
3. No errors in backend logs
4. `JWT_SECRET_KEY` is set in `.env`

## Security Notes

1. **JWT Secret Key**: Must be strong and secret
   - Use a long random string (32+ characters)
   - Never commit to git
   - Change in production

2. **Token Expiration**: Default is 7 days
   - Adjust in `oauth_service.py` if needed
   - Consider refresh tokens for longer sessions

3. **HTTPS**: Always use HTTPS in production
   - Tokens in URL hash are more secure than query params
   - But still use HTTPS to prevent interception

## Summary

✅ **JWT tokens ARE being assigned** to OAuth users
✅ **Custom JWT tokens work** for API authentication
✅ **Middleware validates tokens** properly
✅ **No database changes required** (migration is optional)

The system works as-is. The migration (`008_ensure_oauth_user_linking.sql`) is optional and just adds helpful metadata.

