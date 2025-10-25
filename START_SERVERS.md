# 🚀 Start Mayhouse ETH Servers

## ⚠️ **You're seeing "Network Error" because the backend isn't running!**

Follow these steps to fix it:

---

## 📋 **Prerequisites Check**

Before starting, make sure you have:
- ✅ Python 3.11+ installed
- ✅ Node.js 20+ installed
- ✅ Supabase credentials (or use mock mode)

---

## 🔧 **Step-by-Step Fix**

### **1️⃣ Start Backend Server** (Terminal 1)

```bash
# Navigate to backend directory
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/backend

# Install dependencies (if not done already)
pip install -r requirements.txt

# IMPORTANT: Edit .env file with your Supabase credentials
# Open .env in a text editor and replace:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY  
# - SUPABASE_SERVICE_KEY

# Start the backend server
python main.py
```

**Expected output:**
```
🚀 Starting Mayhouse ETH Backend v1.0.0
✅ Connected to Supabase successfully
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**✅ Backend should now be running on http://localhost:8000**

---

### **2️⃣ Test Backend** (New Terminal)

```bash
# Test health endpoint
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy",...}

# Test wallet auth endpoint
curl http://localhost:8000/docs

# Should open API docs in browser
```

---

### **3️⃣ Check Frontend** (Terminal 2)

Your frontend should already be running on port 3000. If not:

```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/frontend
npm run dev
```

---

## 🎯 **Quick Test**

1. ✅ Backend running → http://localhost:8000
2. ✅ Frontend running → http://localhost:3000
3. ✅ Go to http://localhost:3000/login
4. ✅ Click "Connect Wallet"
5. ✅ Sign message
6. ✅ Success! 🎉

---

## 🔍 **Troubleshooting**

### **Error: "Please configure SUPABASE_URL"**

Your `.env` file needs real Supabase credentials.

**Option A: Use Your Supabase** (Recommended)
1. Go to https://supabase.com
2. Create/open your project
3. Go to Settings → API
4. Copy credentials to `.env`

**Option B: Mock Mode for Testing** (Temporary)
The backend will still start, but database operations will fail. You can test the endpoints structure.

---

### **Error: "Address already in use"**

Something else is using port 8000.

```bash
# Find what's using port 8000
lsof -ti:8000

# Kill it
kill -9 $(lsof -ti:8000)

# Or use a different port
uvicorn main:app --port 8001
```

---

### **Error: "Module not found"**

```bash
cd backend
pip install -r requirements.txt
```

---

## 📝 **Configuration Files**

### **Backend (.env)**
Location: `backend/.env`

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...
JWT_SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:3000
```

### **Frontend (.env.local)**
Location: `frontend/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

---

## ✅ **Success Checklist**

- [ ] Backend running on http://localhost:8000
- [ ] Can access http://localhost:8000/docs
- [ ] Frontend running on http://localhost:3000
- [ ] No "Network Error" on login page
- [ ] Can connect wallet successfully

---

## 🆘 **Still Having Issues?**

### Check Backend Logs
Look at the terminal where you ran `python main.py`. You should see:
- ✅ "Starting Mayhouse ETH Backend"
- ✅ "Connected to Supabase successfully"
- ✅ "Uvicorn running on http://0.0.0.0:8000"

### Check Frontend Console
Open browser DevTools (F12) → Console tab. Look for:
- ❌ "Network Error" → Backend not running
- ❌ "CORS error" → Backend not configured correctly
- ❌ "Failed to fetch" → Wrong URL in .env.local

### Check Network Tab
Open browser DevTools (F12) → Network tab:
- Look for requests to `http://localhost:8000/auth/wallet/nonce`
- Status should be 200 (not 0, 404, or 500)

---

## 📚 **Next Steps**

Once both servers are running:
1. Go to http://localhost:3000/login
2. Click "Connect Wallet"
3. Connect MetaMask
4. Sign the authentication message
5. You should be redirected and logged in! 🎉

---

**Need more help?** Check:
- [QUICKSTART.md](./QUICKSTART.md) - Quick setup
- [SETUP.md](./SETUP.md) - Detailed setup
- [README.md](./README.md) - Full documentation

---

**Last Updated:** October 25, 2025

