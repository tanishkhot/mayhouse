# Mayhouse Backend Deployment

This directory contains deployment scripts for the Mayhouse backend service.

## Files

- `deploy.sh` - Main deployment script that handles Docker and systemd setup
- `README.md` - This documentation file

## Quick Start

### 1. Prerequisites

- Docker installed and running
- systemd-based Linux system (Ubuntu, CentOS, Amazon Linux, etc.)
- sudo privileges for systemd operations

### 2. Run Deployment

```bash
# Navigate to the deployment directory
cd /path/to/mayhouse/backend/deployment

# Run the deployment script
./deploy.sh
```

### 3. What the Script Does

The deployment script will:

1. **Check Prerequisites**

   - Verify Docker is installed
   - Verify systemctl is available
   - Check for required files (Dockerfile, requirements.txt, .env, service files)

2. **Docker Operations**

   - Stop and remove existing container
   - Remove old Docker image
   - Build new Docker image
   - Start new container with proper configuration

3. **Systemd Service Setup**

   - Copy service file to `/etc/systemd/system/`
   - Run the systemd setup script
   - Enable the service for auto-start on boot
   - Check service status

4. **Verification**
   - Check container status
   - Check service status
   - Test health endpoint
   - Display management commands

## Manual Commands

If you prefer to run commands manually:

### Docker Commands

```bash
# Stop and remove container
docker stop mayhouse-backend-container
docker rm mayhouse-backend-container

# Build and run
docker build -t mayhouse-backend-image .
docker run -d --name mayhouse-backend-container -p 8000:8000 --restart unless-stopped mayhouse-backend-image
```

### Systemd Commands

```bash
# Copy service file
sudo cp service_files/mayhouse-backend.service /etc/systemd/system/

# Setup service
sudo service_files/setup-systemd.sh

# Enable and start
sudo systemctl enable mayhouse-backend
sudo systemctl start mayhouse-backend
```

## Monitoring

### View Logs

```bash
# Docker logs
docker logs -f mayhouse-backend-container

# Systemd logs
sudo journalctl -u mayhouse-backend -f
```

### Check Status

```bash
# Container status
docker ps

# Service status
sudo systemctl status mayhouse-backend
```

## Troubleshooting

### Container Issues

```bash
# Check container logs
docker logs mayhouse-backend-container

# Check container health
docker inspect mayhouse-backend-container | grep -A 10 "Health"
```

### Service Issues

```bash
# Check service logs
sudo journalctl -u mayhouse-backend --since '10 minutes ago'

# Restart service
sudo systemctl restart mayhouse-backend
```

### Port Issues

```bash
# Check if port is listening
sudo netstat -tlnp | grep 8000

# Check firewall (if applicable)
sudo ufw status
```

## Configuration

Make sure your `.env` file is properly configured with:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET_KEY`
- Other required environment variables

## Security Notes

- The script creates a non-root user in the Docker container
- Service runs with appropriate systemd security settings
- Make sure to use strong JWT secrets in production
- Consider using Docker secrets for sensitive data in production
