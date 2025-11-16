# Backend Environment Variables Setup

## Critical Environment Variables

The backend **requires** these environment variables to function properly:

### Supabase Configuration (REQUIRED)

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

**Where to find these:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY` (⚠️ Keep this secret!)

### JWT Configuration (REQUIRED)

```bash
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

**Generate a secure JWT secret:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Blockchain Configuration (Optional for basic auth)

```bash
BLOCKCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
CONTRACT_ADDRESS=0x09aB660CEac220678b42E0e23DebCb1475e1eAD5
PLATFORM_PRIVATE_KEY=0x...your_private_key_here...
ETH_PRICE_INR=200000
```

## Error: "Supabase URL and service key must be provided"

If you see this error, it means:

1. **The backend is missing required environment variables**
   - Check that `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set
   - Verify they are loaded correctly in your deployment environment

2. **For local development:**
   ```bash
   cd backend
   cp env.example .env
   # Edit .env with your actual Supabase credentials
   ```

3. **For production deployment (EC2):**
   
   **Option A: Using the setup script (Recommended)**
   ```bash
   # SSH into your EC2 instance
   ssh -i your-key.pem ubuntu@ec2-18-223-166-226.us-east-2.compute.amazonaws.com
   
   # Navigate to backend directory
   cd /path/to/mayhouse/backend
   
   # Run the setup script
   ./scripts/setup-env-ec2.sh
   ```
   
   **Option B: Manual setup**
   ```bash
   # SSH into EC2 instance
   ssh -i your-key.pem ubuntu@ec2-18-223-166-226.us-east-2.compute.amazonaws.com
   
   # Navigate to backend directory
   cd /path/to/mayhouse/backend
   
   # Create or edit .env file
   nano .env  # or use vim/vi
   
   # Add your Supabase credentials:
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   JWT_SECRET_KEY=your-secret-key
   
   # Restart the backend service
   sudo systemctl restart mayhouse-backend
   # OR if using Docker:
   docker restart mayhouse-backend-container
   ```
   
   **Check if variables are set:**
   ```bash
   cd /path/to/mayhouse/backend
   ./scripts/check-env.sh
   ```
   
   **Other hosting platforms:**
   - **Vercel**: Project Settings → Environment Variables
   - **Docker**: Use `-e` flags or `.env` file
   - **Kubernetes**: Use ConfigMaps or Secrets

4. **Verify environment variables are loaded:**
   ```bash
   # Check if variables are set
   python3 -c "from app.core.config import get_settings; s = get_settings(); print(f'URL: {s.supabase_url[:20]}...' if s.supabase_url else 'URL: NOT SET'); print(f'Service Key: {\"SET\" if s.supabase_service_key else \"NOT SET\"}')"
   ```

## Quick Fix Checklist

- [ ] `SUPABASE_URL` is set and valid
- [ ] `SUPABASE_ANON_KEY` is set and valid
- [ ] `SUPABASE_SERVICE_KEY` is set and valid (⚠️ service_role key, not anon key)
- [ ] `JWT_SECRET_KEY` is set and secure
- [ ] Environment variables are loaded in your deployment environment
- [ ] Backend server has been restarted after setting environment variables

## Testing

After setting environment variables, test the authentication endpoint:

```bash
# Test nonce generation (should work without auth)
curl -X POST http://localhost:8000/auth/wallet/nonce \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "0x123..."}'

# Should return: {"nonce": "...", "message": "..."}
```

If this fails, check your Supabase configuration.

