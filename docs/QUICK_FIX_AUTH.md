# 🔧 Quick Fix: Authentication Error

## Problem
You're seeing this error on the login page:
```
Authentication failed: Supabase URL and service key must be provided
```

## Root Cause
The backend server on EC2 doesn't have the Supabase environment variables configured.

## Solution (5 minutes)

### Step 1: Get Your Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your Mayhouse project
3. Navigate to **Settings → API**
4. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`) ⚠️ **Keep this secret!**

### Step 2: SSH into EC2 and Configure

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@ec2-18-223-166-226.us-east-2.compute.amazonaws.com

# Navigate to backend directory (adjust path as needed)
cd ~/mayhouse/backend
# OR wherever your backend code is located

# Run the setup script
./scripts/setup-env-ec2.sh
```

The script will:
- Create `.env` file if it doesn't exist
- Guide you to edit it with your credentials
- Verify all variables are set
- Restart the backend service

### Step 3: Verify It Works

```bash
# Test the health endpoint
curl http://localhost:8000/health

# Test nonce generation (should work now)
curl -X POST http://localhost:8000/auth/wallet/nonce \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "0x1234567890123456789012345678901234567890"}'
```

### Step 4: Test Authentication on Frontend

1. Go to https://mayhouse.vercel.app/login
2. Connect your wallet
3. Authentication should now work! ✅

## Alternative: Manual Setup

If the script doesn't work, do it manually:

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@ec2-18-223-166-226.us-east-2.compute.amazonaws.com

# Navigate to backend
cd ~/mayhouse/backend

# Edit .env file
nano .env

# Add these lines (replace with your actual values):
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET_KEY=your-secure-random-string-here

# Save and exit (Ctrl+X, then Y, then Enter)

# Restart backend
sudo systemctl restart mayhouse-backend
# OR
docker restart mayhouse-backend-container

# Check status
sudo systemctl status mayhouse-backend
```

## Troubleshooting

### "Permission denied" when running script
```bash
chmod +x scripts/setup-env-ec2.sh
chmod +x scripts/check-env.sh
```

### "Service not found" error
The backend might be running in Docker instead of systemd:
```bash
# Check if Docker container is running
docker ps | grep mayhouse

# Restart Docker container
docker restart mayhouse-backend-container
```

### Still getting errors?
1. Check backend logs:
   ```bash
   sudo journalctl -u mayhouse-backend -n 50
   # OR
   docker logs mayhouse-backend-container
   ```

2. Verify environment variables are loaded:
   ```bash
   cd ~/mayhouse/backend
   ./scripts/check-env.sh
   ```

3. Make sure you're using the **service_role** key, not the **anon** key for `SUPABASE_SERVICE_KEY`

## Need Help?

If you're still stuck:
1. Check the full documentation: `docs/BACKEND_ENV_SETUP.md`
2. Verify your Supabase project is active and accessible
3. Make sure the backend code is up to date (pull latest changes)

