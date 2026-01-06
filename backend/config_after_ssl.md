# Configuration Updates After SSL Setup

After setting up `api.mayhouse.in` with SSL, update these configurations:

## 1. Backend `.env` on EC2

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@ec2-18-223-166-226.us-east-2.compute.amazonaws.com

# Edit .env file
cd /path/to/backend
nano .env

# Update these lines:
OAUTH_REDIRECT_URI=https://api.mayhouse.in/auth/oauth/google/callback
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://mayhouse.in,https://www.mayhouse.in,https://mayhouse-git-main-tanishkhots-projects.vercel.app

# Save and restart
sudo systemctl restart mayhouse-backend
# OR
docker restart mayhouse-backend-container
```

## 2. Vercel Environment Variable

Go to: Vercel Dashboard → mayhouse → Settings → Environment Variables

**Edit existing variable:**
- Key: `NEXT_PUBLIC_API_BASE_URL`
- Value: `https://api.mayhouse.in`
- Environments: ✓ Production ✓ Preview ✓ Development

**Save and Redeploy**

## 3. Google OAuth Console

Go to: https://console.cloud.google.com/apis/credentials

### Authorized JavaScript origins:
- `http://localhost:8000`
- `http://localhost:3000`
- `https://api.mayhouse.in` ← **ADD THIS**
- `https://mayhouse.in`
- `https://www.mayhouse.in`

### Authorized redirect URIs:
- `http://localhost:8000/auth/oauth/google/callback`
- `http://localhost:3000/auth/oauth/google/callback`
- `https://api.mayhouse.in/auth/oauth/google/callback` ← **ADD THIS**

**Click Save**

## 4. Frontend `.env.local` (for local development)

```bash
# Local development only
NEXT_PUBLIC_API_BASE_URL=https://api.mayhouse.in
```

## 5. Test the Setup

### Test 1: Backend Health Check
```bash
curl https://api.mayhouse.in/health/
```
Should return: `{"status":"healthy"}`

### Test 2: SSL Certificate
```bash
curl -I https://api.mayhouse.in/health/
```
Should show `HTTP/2 200` and no SSL errors

### Test 3: CORS
Open your frontend and check browser console for CORS errors

### Test 4: OAuth Flow
1. Go to https://www.mayhouse.in/login
2. Click "Sign in with Google"
3. Should redirect to Google login
4. After login, should redirect back to your app

## Troubleshooting

### If OAuth fails:
- Check backend logs: `sudo journalctl -u mayhouse-backend -f`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify Google OAuth Console has correct URLs

### If SSL fails:
- Check DNS: `nslookup api.mayhouse.in`
- Check certificate: `sudo certbot certificates`
- Renew certificate: `sudo certbot renew`

### If CORS fails:
- Check backend CORS_ORIGINS in .env
- Restart backend after changes
- Clear browser cache

