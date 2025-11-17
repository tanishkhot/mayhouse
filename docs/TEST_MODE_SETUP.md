# Test Mode Setup Guide

This guide explains how to test the booking flow **without authentication**.

## ✅ Setup Complete!

Test mode has been configured. Here's what was set up:

### Configuration Added to `.env`:
```bash
DEBUG=true
TEST_USER_ID=ecf9cf64-6078-42a2-aace-4fde46537de3
```

### Test User Created:
- **ID**: `ecf9cf64-6078-42a2-aace-4fde46537de3`
- **Email**: `test@mayhouse.local`
- **Name**: Test User
- **Role**: user

---

## How It Works

When `DEBUG=true` and `TEST_USER_ID` is set in `.env`:

1. **Booking endpoints** (`POST /bookings`, etc.) will accept requests **without** an `Authorization` header
2. The system automatically uses the `TEST_USER_ID` as the authenticated user
3. No OAuth or wallet authentication needed!

---

## Testing the Booking Flow

### 1. Restart Your Backend Server

After updating `.env`, restart the backend:

```bash
cd backend
# If using uvicorn directly:
uvicorn app.main:app --reload

# Or however you normally start your server
```

### 2. Test Booking API Directly

You can now call the booking API **without any auth token**:

```bash
# Calculate booking cost (no auth needed)
curl -X POST http://localhost:8000/blockchain/calculate-booking-cost \
  -H "Content-Type: application/json" \
  -d '{
    "event_run_id": "your-event-run-id",
    "seat_count": 2
  }'

# Create booking (no auth needed in test mode!)
curl -X POST http://localhost:8000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "event_run_id": "your-event-run-id",
    "seat_count": 2
  }'
```

### 3. Test from Frontend

The frontend booking buttons should now work without requiring login!

- Navigate to an event run page
- Click "Book Now"
- The booking should complete without authentication

---

## Using a Different Test User

If you want to use a different user as the test user:

### Option 1: Use Existing User

1. List existing users:
   ```bash
   python backend/scripts/create_test_user.py --list
   ```

2. Copy a user ID from the output

3. Update `.env`:
   ```bash
   TEST_USER_ID=your-chosen-user-id
   ```

### Option 2: Create New Test User

```bash
cd backend
python scripts/create_test_user.py
```

This will create a new test user and show you the ID to add to `.env`.

---

## Disabling Test Mode

To require authentication again:

1. Set `DEBUG=false` in `.env`, OR
2. Remove `TEST_USER_ID` from `.env`, OR
3. Comment out both settings

**Important**: Test mode should **only** be enabled in development. Never enable it in production!

---

## Troubleshooting

### "Missing or invalid authorization header" error

- Check that `DEBUG=true` (lowercase) in `.env`
- Check that `TEST_USER_ID` is set in `.env`
- Restart your backend server after changing `.env`

### Test user not found

- Verify the user exists in database:
  ```bash
  python backend/scripts/create_test_user.py --list
  ```
- Recreate test user:
  ```bash
  python backend/scripts/create_test_user.py
  ```

### Still requires authentication

- Make sure you restarted the backend after updating `.env`
- Check that `.env` file is in the `backend/` directory
- Verify settings are loaded: Check backend startup logs for "✅ Loaded .env"

---

## Security Notes

⚠️ **WARNING**: Test mode bypasses authentication!

- Only enable in **development**
- Never commit `.env` with `DEBUG=true` to production
- Test mode allows anyone to create bookings as the test user
- Always disable test mode before deploying to production

---

## Scripts Available

### Create Test User
```bash
python backend/scripts/create_test_user.py
```

### List Existing Users
```bash
python backend/scripts/create_test_user.py --list
```

### Setup Test Mode (Shell Script)
```bash
bash backend/scripts/setup_test_mode.sh
```

---

## Next Steps

1. ✅ Test mode is configured
2. 🔄 **Restart your backend server**
3. 🧪 Test the booking flow from frontend
4. 🎉 Enjoy testing without authentication!

