# EC2 Deployment Fix for Supabase Configuration

## Problem
The backend service was failing to start on EC2 with the error:
```
ValueError: Supabase URL and service key must be provided
```

This happened because:
1. The `.env` file wasn't accessible inside the Docker container
2. Service clients were being initialized at module import time, before `.env` was loaded

## Solution Applied

### 1. Lazy Service Client Initialization
Changed `DesignExperienceService` to use lazy initialization instead of initializing the database client in `__init__`:

**Before:**
```python
class DesignExperienceService:
    def __init__(self) -> None:
        self._db = get_service_client()  # Fails if .env not loaded
```

**After:**
```python
class DesignExperienceService:
    def __init__(self) -> None:
        self._db: Optional[Client] = None

    @property
    def _db_client(self) -> Client:
        """Lazy initialization of database client."""
        if self._db is None:
            self._db = get_service_client()
        return self._db
```

### 2. Improved .env File Loading
Updated `app/core/config.py` to search for `.env` file in multiple locations:
- `backend/.env` (local development)
- `project/backend/.env` (project root)
- `/app/.env` (Docker container)
- Current working directory (systemd)

### 3. Docker Volume Mount for .env
Updated the systemd service file to mount the `.env` file into the Docker container:

```ini
ExecStart=/usr/bin/docker run --name mayhouse-backend -p 8000:8000 \
  --restart unless-stopped \
  -v /home/ec2-user/mayhouse/backend/.env:/app/.env:ro \
  mayhouse-backend
```

## Deployment Steps on EC2

### Step 1: Copy .env file to EC2
```bash
# From your local machine
scp -i your-key.pem backend/.env ubuntu@ec2-18-223-166-226.us-east-2.compute.amazonaws.com:~/mayhouse/backend/.env
```

### Step 2: SSH into EC2 and verify
```bash
ssh -i your-key.pem ubuntu@ec2-18-223-166-226.us-east-2.compute.amazonaws.com
cd ~/mayhouse/backend

# Verify .env file exists
ls -la .env

# Check environment variables
./scripts/check-env.sh
```

### Step 3: Update systemd service file
```bash
# Copy updated service file
sudo cp service_files/mayhouse-backend.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Restart the service
sudo systemctl restart mayhouse-backend

# Check status
sudo systemctl status mayhouse-backend

# View logs
sudo journalctl -u mayhouse-backend -f
```

### Step 4: Verify it's working
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test Supabase connection
python3 scripts/test-supabase-connection.py
```

## Alternative: Pass Environment Variables Directly

If mounting the `.env` file doesn't work, you can pass environment variables directly to Docker:

```ini
ExecStart=/usr/bin/docker run --name mayhouse-backend -p 8000:8000 \
  --restart unless-stopped \
  -e SUPABASE_URL=https://atapqqzbnayfbanybwzb.supabase.co \
  -e SUPABASE_ANON_KEY=eyJ... \
  -e SUPABASE_SERVICE_KEY=eyJ... \
  -e JWT_SECRET_KEY=development-secret-key-change-in-production-12345678 \
  mayhouse-backend
```

However, this is less secure and harder to maintain. Mounting the `.env` file is preferred.

## Troubleshooting

### Service still failing?
1. Check if `.env` file exists and is readable:
   ```bash
   ls -la /home/ec2-user/mayhouse/backend/.env
   cat /home/ec2-user/mayhouse/backend/.env | head -5
   ```

2. Check Docker container logs:
   ```bash
   docker logs mayhouse-backend
   ```

3. Verify the volume mount:
   ```bash
   docker inspect mayhouse-backend | grep -A 10 Mounts
   ```

4. Test inside the container:
   ```bash
   docker exec mayhouse-backend ls -la /app/.env
   docker exec mayhouse-backend cat /app/.env | head -5
   ```

### Permission issues?
```bash
# Make sure the .env file is readable
chmod 644 /home/ec2-user/mayhouse/backend/.env

# Check ownership
ls -la /home/ec2-user/mayhouse/backend/.env
```

## Files Changed
- `backend/app/services/design_experience_service.py` - Lazy initialization
- `backend/app/core/config.py` - Improved .env loading
- `backend/service_files/mayhouse-backend.service` - Added volume mount

