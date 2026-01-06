# Migration to api.mayhouse.in - Completion Summary

## Status: 90% Complete

### Completed Steps ✅

1. **Local Development Environment** ✅
   - Created `frontend/.env.local` with `NEXT_PUBLIC_API_BASE_URL=https://api.mayhouse.in`
   - Configuration committed and pushed to repository

2. **Backend Configuration on EC2** ✅
   - Updated `OAUTH_REDIRECT_URI=https://api.mayhouse.in/auth/oauth/google/callback`
   - Updated `CORS_ORIGINS` to include all frontend domains
   - Backend service restarted successfully
   - Configuration is active and working

3. **Backend Service** ✅
   - Service restarted via systemd
   - Verified healthy status: `curl https://api.mayhouse.in/health/`
   - Returns: `{"status":"healthy","message":"Mayhouse Backend is running"}`

4. **Configuration Scripts Created** ✅
   - `update_backend_env.sh` - Helper script for EC2 updates
   - `backend/update_env_for_production.sh` - Automated env updater
   - `VERCEL_UPDATE_INSTRUCTIONS.md` - Step-by-step Vercel guide
   - All scripts committed to repository

5. **Verification Tests** ✅
   - Backend health check: PASSED
   - Local .env.local configuration: CONFIRMED
   - EC2 backend environment: VERIFIED
   - CORS origins: CONFIGURED
   - OAuth redirect URI: SET

### Remaining Manual Steps ⚠️

#### 1. Update Vercel Environment Variable (5 minutes)

Follow instructions in [`VERCEL_UPDATE_INSTRUCTIONS.md`](VERCEL_UPDATE_INSTRUCTIONS.md):

1. Go to https://vercel.com/dashboard
2. Select "mayhouse" project
3. Settings → Environment Variables
4. Edit `NEXT_PUBLIC_API_BASE_URL` to: `https://api.mayhouse.in`
5. Apply to: Production, Preview, Development
6. Save and Redeploy

#### 2. Restart Local Development Server

If your dev server is currently running:

```bash
# Stop current server (Ctrl+C)
cd /Users/maverick/post-hackathon/mayhouse/frontend
npm run dev
```

The server will automatically pick up the new `.env.local` configuration.

## Verification Checklist

After completing the manual steps above, verify:

### Backend
- [x] Health endpoint responds: `curl https://api.mayhouse.in/health/`
- [x] OAuth redirect URI set to: `https://api.mayhouse.in/auth/oauth/google/callback`
- [x] CORS includes all frontend domains
- [x] Service running and active

### Local Development
- [x] `.env.local` contains `NEXT_PUBLIC_API_BASE_URL=https://api.mayhouse.in`
- [ ] Dev server restarted (do this manually)
- [ ] Browser console shows API calls to `api.mayhouse.in`
- [ ] No CORS errors in browser console

### Production (Vercel)
- [ ] Environment variable updated (do this manually)
- [ ] Redeployment triggered
- [ ] Production site uses `api.mayhouse.in`

### OAuth Flow
- [ ] Visit https://mayhouse.in/login
- [ ] Click "Sign in with Google"
- [ ] Should redirect to Google OAuth
- [ ] After login, should redirect to `https://mayhouse.in/auth/callback`
- [ ] Should complete authentication and show homepage

## Configuration Summary

| Component | Configuration | Status |
|-----------|--------------|--------|
| Local Dev (.env.local) | `https://api.mayhouse.in` | ✅ SET |
| Vercel Env Var | `https://api.mayhouse.in` | ⚠️ MANUAL |
| Backend OAuth | `https://api.mayhouse.in/auth/oauth/google/callback` | ✅ SET |
| Backend CORS | All domains included | ✅ SET |
| SSL Certificate | Valid and working | ✅ ACTIVE |
| Backend Service | Systemd running | ✅ ACTIVE |

## Files Modified/Created

### Modified
- `frontend/.env.local` - Added production backend URL

### Created
- `VERCEL_UPDATE_INSTRUCTIONS.md` - Vercel update guide
- `backend/update_env_for_production.sh` - Automated env updater
- `update_backend_env.sh` - Helper script with commands
- `MIGRATION_COMPLETE_SUMMARY.md` - This file

### Backend (EC2)
- `~/mayhouse/backend/.env` - Updated OAuth and CORS
- Backup created: `.env.backup.YYYYMMDD_HHMMSS`

## Rollback Instructions

If you need to rollback to localhost:

```bash
# 1. Update local .env.local
cd /Users/maverick/post-hackathon/mayhouse/frontend
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local

# 2. Start local backend
cd /Users/maverick/post-hackathon/mayhouse/backend
python3 -m uvicorn main:app --reload --port 8000

# 3. Restart dev server
cd /Users/maverick/post-hackathon/mayhouse/frontend
npm run dev
```

## Next Steps

1. **Complete Vercel update** (see `VERCEL_UPDATE_INSTRUCTIONS.md`)
2. **Restart your dev server** to pick up new configuration
3. **Test OAuth flow** on production site
4. **Monitor logs** for any issues during first use

## Support

If you encounter issues:

1. Check backend health: `curl https://api.mayhouse.in/health/`
2. Check backend logs: SSH to EC2 and run `sudo journalctl -u mayhouse-backend -f`
3. Check browser console for CORS or network errors
4. Verify Google OAuth Console has all correct URLs

## Success Criteria

✅ Backend responds at `https://api.mayhouse.in`  
✅ SSL certificate is valid  
✅ OAuth redirect URI configured  
✅ CORS allows all frontend domains  
⚠️ Vercel environment variable updated (manual)  
⚠️ Dev server restarted with new config  
⚠️ OAuth flow works end-to-end  

---

**Migration started:** 2026-01-06  
**Backend updated:** 2026-01-06 17:43 UTC  
**Status:** Awaiting manual Vercel update and dev server restart

