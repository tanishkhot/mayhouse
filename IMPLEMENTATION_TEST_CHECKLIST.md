# Implementation Test Checklist

This document provides a checklist to verify that all OAuth and authentication features are properly implemented.

## Backend Tests

### OAuth Service Tests
- [ ] Run `pytest backend/tests/test_oauth.py::TestOAuthLogin` - Verify OAuth login redirects
- [ ] Run `pytest backend/tests/test_oauth.py::TestOAuthCallback` - Verify callback handling
- [ ] Run `pytest backend/tests/test_oauth.py::TestOAuthService` - Verify service functions

### Token Validation Tests
- [ ] Run `pytest backend/tests/test_oauth.py::TestTokenValidation` - Verify both token types work
- [ ] Run `pytest backend/tests/test_auth_integration.py::TestTokenCompatibility` - Verify token compatibility

### Integration Tests
- [ ] Run `pytest backend/tests/test_auth_integration.py` - Verify complete flows

## Frontend Tests

### Component Tests
- [ ] Run frontend tests (if test runner configured)
- [ ] Verify wallet detection hook works
- [ ] Verify OAuth callback handler works
- [ ] Verify token storage/retrieval works

## Manual Testing Checklist

### Google OAuth Flow
1. [ ] Navigate to `/login` page
2. [ ] Click "Continue with Google" button
3. [ ] Verify redirect to Google OAuth consent screen
4. [ ] Complete Google authentication
5. [ ] Verify redirect back to `/auth/callback`
6. [ ] Verify token is stored in localStorage
7. [ ] Verify redirect to homepage
8. [ ] Verify user is authenticated (navbar shows user menu)
9. [ ] Verify `/auth/me` endpoint returns user data
10. [ ] Verify protected routes are accessible

### Wallet Authentication Flow
1. [ ] Navigate to `/login` page (with wallet installed)
2. [ ] Verify "Connect Wallet" button appears
3. [ ] Click "Connect Wallet" button
4. [ ] Connect wallet in RainbowKit modal
5. [ ] Verify automatic authentication flow
6. [ ] Verify token is stored in localStorage
7. [ ] Verify redirect to homepage
8. [ ] Verify user is authenticated
9. [ ] Verify `/auth/me` endpoint returns user data

### Wallet Detection
1. [ ] Navigate to `/login` page WITHOUT wallet installed
2. [ ] Verify only Google OAuth button is shown
3. [ ] Verify "Get MetaMask" message appears
4. [ ] Install wallet extension
5. [ ] Refresh page
6. [ ] Verify wallet option now appears

### Mixed Authentication
1. [ ] Authenticate with Google OAuth
2. [ ] Verify you can access the app
3. [ ] Logout
4. [ ] Authenticate with wallet
5. [ ] Verify you can access the app
6. [ ] Verify both methods work independently

### Navbar Authentication State
1. [ ] Authenticate with Google (no wallet)
2. [ ] Verify navbar shows authenticated state
3. [ ] Verify user menu is accessible
4. [ ] Logout
5. [ ] Authenticate with wallet
6. [ ] Verify navbar shows authenticated state

### Protected Routes
1. [ ] Try to access protected route without authentication
2. [ ] Verify redirect to `/login`
3. [ ] Authenticate (either method)
4. [ ] Try to access protected route again
5. [ ] Verify access is granted

### Error Handling
1. [ ] Test OAuth callback with error parameter
2. [ ] Verify error message is displayed
3. [ ] Test invalid token in `/auth/me`
4. [ ] Verify 401 error is returned
5. [ ] Test missing OAuth configuration
6. [ ] Verify appropriate error message

## API Endpoint Verification

### Backend Endpoints
- [ ] `GET /auth/oauth/google/login` - Returns redirect to Google
- [ ] `GET /auth/oauth/google/callback?code=...` - Handles OAuth callback
- [ ] `GET /auth/me` - Returns user data (works with both token types)
- [ ] `POST /auth/wallet/nonce` - Returns nonce for wallet auth
- [ ] `POST /auth/wallet/verify` - Verifies wallet signature

### Frontend Routes
- [ ] `/login` - Shows both authentication options
- [ ] `/auth/callback` - Handles OAuth callback
- [ ] Protected routes work with both auth methods

## Configuration Verification

### Backend Environment Variables
- [ ] `GOOGLE_CLIENT_ID` is set
- [ ] `GOOGLE_CLIENT_SECRET` is set
- [ ] `OAUTH_REDIRECT_URI` is set correctly
- [ ] `SUPABASE_URL` is set
- [ ] `SUPABASE_SERVICE_KEY` is set

### Frontend Environment Variables
- [ ] API proxy is configured correctly
- [ ] WalletConnect project ID is set (if using)

## Code Quality Checks

- [ ] No linter errors in backend
- [ ] No linter errors in frontend
- [ ] All imports are correct
- [ ] TypeScript types are correct
- [ ] Python type hints are correct

## Performance Checks

- [ ] OAuth redirect happens quickly (< 2 seconds)
- [ ] Token validation is fast (< 500ms)
- [ ] Wallet detection is instant
- [ ] No unnecessary re-renders in React components

## Security Checks

- [ ] Tokens are stored securely (localStorage)
- [ ] OAuth state parameter is used (CSRF protection)
- [ ] Tokens are not exposed in URLs (using hash fragment)
- [ ] Invalid tokens are properly rejected
- [ ] Token expiration is handled

## Browser Compatibility

- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Brave
- [ ] Mobile browser support (if applicable)

## Running Tests

### Backend Tests
```bash
cd backend
pytest tests/test_oauth.py -v
pytest tests/test_auth_integration.py -v
```

### Frontend Tests (if configured)
```bash
cd frontend
npm test
# or
npm run test:watch
```

## Notes

- Some tests require mocking external services (Google OAuth, Supabase)
- Manual testing is required for complete OAuth flow
- Wallet authentication requires actual wallet extension
- Integration tests may need test database setup

