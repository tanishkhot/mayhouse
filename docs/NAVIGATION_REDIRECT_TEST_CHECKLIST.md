# Navigation Redirect Test Checklist

This document provides a comprehensive checklist to verify that all navigation redirects work correctly and never fall back to localhost in production.

## Production Environment Tests (on mayhouse.in)

### OAuth Flow
- [ ] Navigate to https://mayhouse.in/login
- [ ] Click "Continue with Google"
- [ ] Verify redirect URL starts with `https://accounts.google.com`
- [ ] Check browser DevTools Network tab - verify no localhost URLs
- [ ] Complete OAuth flow
- [ ] Verify redirect back to `https://mayhouse.in/auth/callback` (NOT localhost)
- [ ] Verify final redirect to `https://mayhouse.in` (NOT localhost)
- [ ] Verify token is stored in localStorage
- [ ] Verify user is authenticated (navbar shows user menu)

### Error Scenarios
- [ ] Trigger OAuth error (deny permission in Google)
- [ ] Verify error redirect goes to `https://mayhouse.in/auth/callback?error=...`
- [ ] Verify NO localhost URLs appear in network tab
- [ ] Verify error message displays correctly
- [ ] Verify redirect to login after 3 seconds

### API Requests
- [ ] Check browser DevTools Network tab
- [ ] Verify all API requests go to `https://api.mayhouse.in` (or via `/api/proxy`)
- [ ] Verify NO requests to `localhost:8000` or `127.0.0.1:8000`
- [ ] Verify all API requests use correct authentication headers

### Console Checks (Production)
- [ ] Open browser DevTools Console
- [ ] Verify NO warnings about "localhost fallback"
- [ ] Verify NO errors about "NEXT_PUBLIC_API_BASE_URL not set"
- [ ] Verify NO console errors related to redirects

## Development Environment Tests (localhost:3000)

### With .env.local Set
- [ ] Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` in `.env.local`
- [ ] Restart dev server (`npm run dev`)
- [ ] Navigate to http://localhost:3000/login
- [ ] Test OAuth flow - should use `http://localhost:8000`
- [ ] Verify console shows NO warnings about missing env var
- [ ] Verify all API requests go to correct backend

### Without .env.local (Fallback Test)
- [ ] Remove or comment out `NEXT_PUBLIC_API_BASE_URL` from `.env.local`
- [ ] Restart dev server (`npm run dev`)
- [ ] Navigate to http://localhost:3000/login
- [ ] Test OAuth flow - should use localhost fallback
- [ ] Verify console shows warning about using fallback: `[OAUTH] NEXT_PUBLIC_API_BASE_URL not set, using fallback`
- [ ] Verify it still works correctly with localhost
- [ ] Restore `.env.local` after testing

### Console Checks (Development)
- [ ] With env var set: NO warnings
- [ ] Without env var: Warnings shown (expected behavior)
- [ ] Verify warnings are clear and actionable

## Backend OAuth Redirect Tests

### Frontend URL Detection
- [ ] Test with `Origin: https://mayhouse.in` header
- [ ] Verify backend uses Origin header correctly
- [ ] Test with `Referer: https://mayhouse.in/login` header (no Origin)
- [ ] Verify backend extracts base URL from Referer
- [ ] Test with no headers
- [ ] Verify backend defaults to `https://mayhouse.in`

### Error Handler
- [ ] Trigger OAuth callback error (invalid code, no state, etc.)
- [ ] Verify redirect goes to `https://mayhouse.in/auth/callback?error=...`
- [ ] Verify NO localhost in redirect URL
- [ ] Verify even if localhost is in CORS_ORIGINS, production URL is preferred

## Automated Test Execution

### Backend Tests
```bash
cd backend
pytest tests/test_oauth_redirects.py -v
pytest tests/test_oauth.py -v
```

### Frontend Tests
```bash
cd frontend
npm test -- navigation-redirects.test.tsx
# Or run all tests
npm test
```

## Edge Cases to Verify

- [ ] OAuth flow from subdomain (www.mayhouse.in)
- [ ] OAuth flow with query parameters in callback
- [ ] Multiple rapid OAuth login attempts
- [ ] Network interruption during OAuth flow
- [ ] Browser back button during OAuth flow
- [ ] OAuth callback with expired state parameter

## Browser Compatibility

Test on multiple browsers to ensure redirects work:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Checks

- [ ] OAuth redirect happens quickly (< 2 seconds)
- [ ] No unnecessary redirects or loops
- [ ] API proxy requests are efficient
- [ ] No console errors or warnings in production

## Security Checks

- [ ] OAuth state parameter is present and validated
- [ ] No tokens exposed in URLs (using hash fragments)
- [ ] HTTPS enforced in production redirects
- [ ] CORS configured correctly

## Notes

- Production tests should be done on actual deployment (mayhouse.in)
- Development tests should be done locally
- Automated tests run in CI/CD pipeline
- Manual tests should be performed before each production deployment
- Keep this checklist updated as redirect logic changes

