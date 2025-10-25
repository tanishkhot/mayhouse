# ✅ Virtual Environment Setup Complete!

## 🎉 What's Been Done

Your backend is now properly set up with a **Python virtual environment (venv)**!

### ✅ Completed
- ✅ Created virtual environment at `backend/venv/`
- ✅ Installed all Python dependencies in the venv
- ✅ Fixed version conflicts in requirements.txt
- ✅ Created `.env` configuration file
- ✅ Created convenient startup script

---

## 🚀 How to Start the Backend

You have **3 easy options** to start the backend:

### **Option 1: Use the Startup Script** (Easiest! ⭐)

```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/backend
./start.sh
```

This script automatically:
- Activates the virtual environment
- Checks for missing files
- Starts the server

### **Option 2: Manual Activation**

```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/backend

# Activate venv
source venv/bin/activate

# Start server
python main.py
```

### **Option 3: One-Liner**

```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/backend && source venv/bin/activate && python main.py
```

---

## 📋 Expected Output

When you start the server, you should see:

```
🚀 Starting Mayhouse ETH Backend v1.0.0
⚠️  Database connection warning: Supabase URL and API key must be provided
Please configure SUPABASE_URL and SUPABASE_ANON_KEY in your .env file
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Note:** The warning about Supabase is expected if you haven't configured it yet!

---

## ⚙️ Configure Supabase (Required for Full Functionality)

The backend will start even without Supabase, but you need it for database operations.

### Step 1: Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Open your project (or create one)
3. Go to **Settings → API**
4. Copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### Step 2: Update .env File

```bash
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/backend
nano .env  # or use your favorite editor
```

Replace the placeholder values:

```env
# Replace these with your actual credentials
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Restart Backend

```bash
# Stop the server (Ctrl+C)
# Start it again
./start.sh
```

Now you should see:
```
✅ Connected to Supabase successfully
```

---

## 🧪 Test the Backend

Once the backend is running:

### **1. Health Check**
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status":"healthy"}
```

### **2. API Documentation**

Open in your browser:
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

You should see:
- ✅ `/health` endpoint
- ✅ `/auth/wallet/nonce` endpoint
- ✅ `/auth/wallet/verify` endpoint
- ✅ `/explore` endpoint

### **3. Test Wallet Auth Endpoint**

```bash
curl -X POST http://localhost:8000/auth/wallet/nonce \
  -H "Content-Type: application/json" \
  -d '{"wallet_address":"0x742d35Cc6634C0532925a3b844Bc454e4438f44e"}'
```

Expected response:
```json
{
  "nonce": "abc123...",
  "message": "Sign this message to authenticate with Mayhouse.\n\nNonce: abc123..."
}
```

---

## 🎯 Now Fix the Frontend Error

With the backend running, your login page should work!

1. **Keep backend terminal open** (don't close it)
2. **Go to frontend** in a new terminal:
   ```bash
   cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/frontend
   npm run dev
   ```
3. **Open browser**: http://localhost:3000/login
4. **Click "Connect Wallet"**
5. **No more "Network Error"!** ✅

---

## 🔧 Virtual Environment Commands

### Activate venv
```bash
source venv/bin/activate
```

You'll see `(venv)` in your terminal prompt:
```
(venv) user@computer backend %
```

### Deactivate venv
```bash
deactivate
```

### Install new packages
```bash
# Always activate venv first!
source venv/bin/activate

# Then install
pip install package-name

# Update requirements.txt
pip freeze > requirements.txt
```

### Check installed packages
```bash
source venv/bin/activate
pip list
```

---

## 📁 What's in the Backend Directory

```
backend/
├── venv/                    ← Virtual environment (don't commit!)
├── app/                     ← Application code
│   ├── api/                 ← API endpoints
│   │   ├── wallet_auth.py   ← Wallet auth endpoints
│   │   ├── health.py
│   │   └── explore.py
│   ├── services/            ← Business logic
│   │   └── wallet_service.py
│   ├── schemas/             ← Pydantic models
│   │   └── wallet.py
│   └── core/                ← Configuration
│       ├── config.py
│       ├── database.py
│       └── jwt_utils.py
├── database/
│   └── migrations/
│       └── 001_add_wallet_address.sql
├── main.py                  ← Entry point
├── requirements.txt         ← Dependencies
├── .env                     ← Configuration (don't commit!)
├── .env.example             ← Example config
└── start.sh                 ← Startup script ⭐
```

---

## 🎓 Why Use a Virtual Environment?

### Benefits:
✅ **Isolation** - Project dependencies don't conflict with system Python  
✅ **Reproducibility** - Same versions across all environments  
✅ **Clean** - Easy to delete and recreate  
✅ **Best Practice** - Industry standard for Python projects

### Without venv:
❌ Package conflicts between projects  
❌ Pollutes system Python  
❌ Hard to manage versions  
❌ Can break system tools

---

## 🆘 Troubleshooting

### "command not found: python3"
```bash
# Try python instead
python -m venv venv
```

### "Permission denied: ./start.sh"
```bash
chmod +x start.sh
```

### "Address already in use" (Port 8000)
```bash
# Find and kill process using port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn main:app --port 8001
```

### "Module not found" error
```bash
# Make sure venv is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Can't activate venv
```bash
# Make sure you're in the backend directory
cd /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/backend

# Full path activation
source /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/backend/venv/bin/activate
```

---

## ✅ Quick Checklist

Before testing your wallet authentication:

- [ ] Backend venv created
- [ ] Dependencies installed in venv
- [ ] .env file configured (at minimum, placeholder values)
- [ ] Backend server running on port 8000
- [ ] Can access http://localhost:8000/docs
- [ ] Health endpoint returns 200 OK
- [ ] Frontend running on port 3000
- [ ] No "Network Error" on login page

---

## 🎯 Next Steps

1. **Start Backend** (this terminal):
   ```bash
   cd mayhouse-eth/backend
   ./start.sh
   ```

2. **Start Frontend** (new terminal):
   ```bash
   cd mayhouse-eth/frontend
   npm run dev
   ```

3. **Test Authentication**:
   - Go to http://localhost:3000/login
   - Click "Connect Wallet"
   - Sign the message
   - Success! 🎉

---

## 📚 Additional Resources

- [Python venv documentation](https://docs.python.org/3/library/venv.html)
- [Backend README](./README.md)
- [Setup Guide](./SETUP.md)
- [Start Servers Guide](./START_SERVERS.md)

---

**Virtual environment setup complete! You're ready to develop! 🚀**

*Last Updated: October 25, 2025*

