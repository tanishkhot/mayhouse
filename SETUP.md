# 🚀 Mayhouse ETH - Setup Guide

Complete guide to set up and run Mayhouse ETH with wallet authentication.

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 20+ installed ([Download](https://nodejs.org/))
- ✅ Python 3.11+ installed ([Download](https://www.python.org/))
- ✅ npm or yarn package manager
- ✅ A Web3 wallet (MetaMask recommended)
- ✅ Supabase account ([Sign up](https://supabase.com))
- ✅ WalletConnect Project ID ([Get here](https://cloud.walletconnect.com))

## 🗄️ Database Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to Project Settings → API
4. Copy your:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### Step 2: Run Database Migration

```sql
-- Connect to your Supabase SQL Editor and run:

-- Add wallet_address column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address 
ON users(wallet_address) 
WHERE wallet_address IS NOT NULL;

-- Make email optional for wallet-only users
ALTER TABLE users 
ALTER COLUMN email DROP NOT NULL;
```

Or use the migration file:
```bash
cd backend
psql <your_supabase_connection_string> -f database/migrations/001_add_wallet_address.sql
```

## 🔧 Backend Setup

### Step 1: Install Dependencies

```bash
cd mayhouse-eth/backend

# Install Python packages
pip install -r requirements.txt

# Or using uv (recommended)
uv pip install -r requirements.txt
```

### Step 2: Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your favorite editor
```

Add your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET_KEY=generate-a-secure-random-string-here
```

### Step 3: Start Backend Server

```bash
# Development mode with auto-reload
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend should be running at: **http://localhost:8000**

Test it:
```bash
curl http://localhost:8000/health
```

## 🎨 Frontend Setup

### Step 1: Install Dependencies

```bash
cd mayhouse-eth/frontend

# Install packages
npm install
```

### Step 2: Get WalletConnect Project ID

1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Sign in with GitHub or Email
3. Create a new project
4. Copy your Project ID

### Step 3: Configure Environment

```bash
# Copy the example env file
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

Add your configuration:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### Step 4: Start Frontend Server

```bash
npm run dev
```

✅ Frontend should be running at: **http://localhost:3000**

## 🎯 Testing the Setup

### 1. Check Backend Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Mayhouse ETH Backend"
}
```

### 2. Check API Documentation

Visit: http://localhost:8000/docs

You should see the FastAPI interactive documentation with:
- `/auth/wallet/nonce` endpoint
- `/auth/wallet/verify` endpoint

### 3. Test Wallet Authentication

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Connect your MetaMask wallet
4. Sign the authentication message
5. You should be redirected to the home page

### 4. Verify JWT Token

After successful login:
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Check for `mayhouse_token` key
4. The value should be a JWT token

## 🔍 Troubleshooting

### Backend Issues

**Error: "Please configure SUPABASE_URL"**
```bash
# Make sure .env file exists and has correct credentials
cd backend
cat .env

# If missing, copy from example
cp .env.example .env
```

**Error: "Failed to connect to Supabase"**
- Check your internet connection
- Verify Supabase URL and keys are correct
- Make sure your Supabase project is active

**Error: "Module not found"**
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend Issues

**Error: "Invalid Project ID"**
- Get a valid WalletConnect Project ID from cloud.walletconnect.com
- Add it to `.env.local`

**Error: "Connection refused"**
- Make sure backend is running on port 8000
- Check NEXT_PUBLIC_API_BASE_URL in `.env.local`

**Wallet not connecting**
- Make sure you have MetaMask or another Web3 wallet installed
- Try refreshing the page
- Check browser console for errors

### Database Issues

**Error: "column wallet_address does not exist"**
```sql
-- Run the migration again
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;
```

**Error: "relation users does not exist"**
- You need to create the users table first
- Check the original Mayhouse backend migrations

## 🎓 Next Steps

Once everything is running:

1. **Test Authentication Flow**
   - Connect wallet → Sign message → Get JWT token

2. **Explore the Code**
   - Backend: `backend/app/api/wallet_auth.py`
   - Frontend: `frontend/src/app/login/page.tsx`

3. **Customize**
   - Update branding
   - Add more chains
   - Implement crypto payments

4. **Deploy**
   - Backend: Railway, Render, or AWS
   - Frontend: Vercel or Netlify
   - Database: Already on Supabase ✓

## 📚 Useful Commands

### Backend
```bash
# Run tests
pytest

# Check code style
black app/
flake8 app/

# Generate new secret key
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### Frontend
```bash
# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

## 🆘 Getting Help

- Check the [README.md](./README.md) for overview
- Review backend API docs at http://localhost:8000/docs
- Check browser console for frontend errors
- Review backend logs in terminal

## ✅ Success Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Database migration completed
- [ ] Environment variables configured
- [ ] WalletConnect Project ID added
- [ ] Wallet connects successfully
- [ ] Can sign authentication message
- [ ] JWT token stored in localStorage
- [ ] Can access protected routes

---

🎉 **Congratulations!** Your Web3-enabled Mayhouse platform is ready!

