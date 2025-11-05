# Docker Setup for Mayhouse Backend (ETH Online Hackathon)

This directory contains Docker configuration files for containerizing and deploying the Mayhouse backend service.

## Files Overview

- **`Dockerfile`** - Multi-stage Docker image definition
- **`docker-compose.yml`** - Development Docker Compose configuration
- **`docker-compose.prod.yml`** - Production Docker Compose configuration
- **`.dockerignore`** - Files to exclude from Docker build context
- **`service_files/`** - Systemd service configuration for production deployment

## Quick Start

### Development

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production

```bash
# Build and run production configuration
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## Manual Docker Commands

```bash
# Build the image
docker build -t mayhouse-backend .

# Run the container
docker run -p 8000:8000 mayhouse-backend

# Run with environment variables
docker run -p 8000:8000 -e SUPABASE_URL=your_url -e SUPABASE_KEY=your_key mayhouse-backend
```

## Production Deployment with Systemd

For production deployment on a Linux server:

1. **Copy files to server:**

   ```bash
   scp -r . user@server:/home/user/ethonline-hackathon/mayhouse/backend/
   ```

2. **Install systemd service:**

   ```bash
   cd /home/user/ethonline-hackathon/mayhouse/backend/service_files
   sudo ./setup-systemd.sh
   ```

3. **Manage the service:**
   ```bash
   sudo systemctl start mayhouse-backend
   sudo systemctl status mayhouse-backend
   sudo systemctl restart mayhouse-backend
   sudo journalctl -u mayhouse-backend -f
   ```

## Environment Variables

The application requires the following environment variables:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase service role key
- `JWT_SECRET` - Secret key for JWT token signing
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)

## Health Checks

The application includes health check endpoints:

- **Container health check:** `http://localhost:8000/health/`
- **Docker Compose health check:** Built-in health monitoring
- **Systemd service:** Automatic restart on failure

## Security Features

- **Non-root user:** Container runs as `app` user
- **Minimal base image:** Python 3.11 slim
- **No cache:** PIP cache disabled for smaller images
- **Resource limits:** Memory limits in production configuration

## Troubleshooting

### Common Issues

1. **Port already in use:**

   ```bash
   # Check what's using port 8000
   lsof -i :8000

   # Kill the process or use different port
   docker run -p 8001:8000 mayhouse-backend
   ```

2. **Environment variables not set:**

   ```bash
   # Check environment variables
   docker exec -it container_name env
   ```

3. **Build failures:**
   ```bash
   # Clean build
   docker build --no-cache -t mayhouse-backend .
   ```

### Logs

```bash
# Docker Compose logs
docker-compose logs -f mayhouse-backend

# Systemd logs
sudo journalctl -u mayhouse-backend -f

# Container logs
docker logs -f container_name
```

## Performance Optimization

The production configuration includes:

- **Memory limits:** 512MB limit, 256MB reservation
- **Health checks:** 30s intervals with 3 retries
- **Restart policy:** `unless-stopped`
- **Resource monitoring:** Built-in health endpoints

## Monitoring

Monitor your deployment:

```bash
# Check container status
docker ps

# Check resource usage
docker stats

# Check service status
sudo systemctl status mayhouse-backend

# View recent logs
sudo journalctl -u mayhouse-backend --since '1 hour ago'
```
