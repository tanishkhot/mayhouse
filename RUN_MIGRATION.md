# 🔧 Run Database Migration - Add Wallet Address

## 🎯 **The Problem**

You're getting this error:
```
column users.wallet_address does not exist
```

This is because your Supabase database doesn't have the `wallet_address` column yet!

---

## ✅ **Solution: Run the Migration**

You have **3 options** to add the column:

---

### **Option 1: Supabase SQL Editor** (Easiest! ⭐)

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Select your project: `atapqqzbnayfbanybwzb`

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste This SQL**

```sql
-- Migration: Add wallet_address column to users table
-- Description: Enables Web3 wallet authentication for Mayhouse ETH

-- Add wallet_address column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address 
ON users(wallet_address) 
WHERE wallet_address IS NOT NULL;

-- Make email optional for wallet-only users
ALTER TABLE users 
ALTER COLUMN email DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.wallet_address IS 'Ethereum wallet address for Web3 authentication';
```

4. **Click "Run" or press Ctrl+Enter**

5. **Verify Success**
   - You should see: "Success. No rows returned"
   - The column is now added! ✅

---

### **Option 2: Using psql Command Line**

If you have `psql` installed:

```bash
# Get your connection string from Supabase Dashboard → Settings → Database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.atapqqzbnayfbanybwzb.supabase.co:5432/postgres" \
  -f /Users/tanishkhot/Coding/Projects/Mayhouse/mayhouse-eth/backend/database/migrations/001_add_wallet_address.sql
```

---

### **Option 3: Using Supabase Table Editor**

1. Go to Supabase Dashboard → Table Editor
2. Select `users` table
3. Click "Add column"
4. Configure:
   - **Name**: `wallet_address`
   - **Type**: `text`
   - **Default**: (leave empty)
   - **Is Unique**: ✅ Check this
   - **Is Nullable**: ✅ Check this
5. Click "Save"

---

## 🔍 **Verify the Migration Worked**

After running the migration, test with SQL Editor:

```sql
-- Check if wallet_address column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'wallet_address';
```

You should see:
```
column_name      | data_type | is_nullable
-----------------|-----------|--------------
wallet_address   | text      | YES
```

---

## 🧪 **Test Your Wallet Authentication Again**

After the migration:

1. **Backend should still be running** (or restart it)
   ```bash
   cd mayhouse-eth/backend
   source venv/bin/activate
   python main.py
   ```

2. **Go to login page**
   - http://localhost:3000/login

3. **Click "Connect Wallet"**

4. **Sign the message**

5. **SUCCESS!** ✨ The wallet address will be saved to the database!

---

## 📊 **What the Migration Does**

1. ✅ Adds `wallet_address` column (TEXT, UNIQUE)
2. ✅ Creates an index for fast wallet lookups
3. ✅ Makes `email` optional (for wallet-only users)
4. ✅ Adds documentation comment

---

## 🎯 **Quick Steps Summary**

1. Go to Supabase Dashboard
2. Open SQL Editor
3. Paste the migration SQL
4. Run it
5. Try wallet login again
6. **It will work!** 🎉

---

## 🆘 **Troubleshooting**

### **Error: "permission denied"**
- Make sure you're logged into the correct Supabase project
- Try using the SQL Editor instead of psql

### **Error: "table users does not exist"**
- Your users table might not be created yet
- Check if you have a `users` table in Table Editor
- You might need to run the initial database setup first

### **Error: "column already exists"**
- Good! The column is already there
- Try the wallet login again

---

## ✅ **After Migration Checklist**

- [ ] Ran the migration SQL
- [ ] Verified `wallet_address` column exists
- [ ] Restarted backend (if needed)
- [ ] Tried wallet login
- [ ] Successfully authenticated with wallet! 🎉

---

**Go run the migration now in Supabase SQL Editor! It takes 10 seconds!** ⚡

*Migration file location: `backend/database/migrations/001_add_wallet_address.sql`*

