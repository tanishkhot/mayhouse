#!/bin/bash

# Mayhouse Backend Deployment Script
# This script handles Docker deployment and systemd service setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="mayhouse-backend-image"
CONTAINER_NAME="mayhouse-backend-container"
SERVICE_NAME="mayhouse-backend"
SERVICE_FILE="mayhouse-backend.service"
SETUP_SCRIPT="setup-systemd.sh"
PORT="8000"

echo -e "${BLUE}🚀 Starting Mayhouse Backend Deployment${NC}"
echo "=================================="

# Check if running as root for systemd operations
if [[ $EUID -ne 0 ]]; then
   echo -e "${YELLOW}⚠️  Note: Some operations require sudo privileges${NC}"
   echo -e "${YELLOW}   The script will prompt for sudo when needed${NC}"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
    exit 1
fi

if ! command_exists systemctl; then
    echo -e "${RED}❌ systemctl is not available (not a systemd system)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Navigate to backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BACKEND_DIR"

echo -e "${BLUE}📁 Script directory: $SCRIPT_DIR${NC}"
echo -e "${BLUE}📁 Backend directory: $BACKEND_DIR${NC}"

echo -e "${BLUE}📁 Working directory: $(pwd)${NC}"

# Check if required files exist
echo -e "${BLUE}📋 Checking required files...${NC}"

if [[ ! -f "Dockerfile" ]]; then
    echo -e "${RED}❌ Dockerfile not found${NC}"
    exit 1
fi

if [[ ! -f "requirements.txt" ]]; then
    echo -e "${RED}❌ requirements.txt not found${NC}"
    exit 1
fi

if [[ ! -f ".env" ]]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo -e "${YELLOW}   Please create .env file with your configuration${NC}"
    echo -e "${YELLOW}   You can copy from env.example${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if [[ ! -f "service_files/$SERVICE_FILE" ]]; then
    echo -e "${RED}❌ Service file not found: service_files/$SERVICE_FILE${NC}"
    exit 1
fi

if [[ ! -f "service_files/$SETUP_SCRIPT" ]]; then
    echo -e "${RED}❌ Setup script not found: service_files/$SETUP_SCRIPT${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Required files check passed${NC}"

# Docker deployment section
echo -e "${BLUE}🐳 Starting Docker deployment...${NC}"

# Stop and remove existing container if it exists
echo -e "${YELLOW}🛑 Stopping existing container...${NC}"
if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
    docker stop "$CONTAINER_NAME"
    echo -e "${GREEN}✅ Container stopped${NC}"
else
    echo -e "${YELLOW}ℹ️  No running container found${NC}"
fi

if docker ps -aq -f name="$CONTAINER_NAME" | grep -q .; then
    docker rm "$CONTAINER_NAME"
    echo -e "${GREEN}✅ Container removed${NC}"
else
    echo -e "${YELLOW}ℹ️  No existing container found${NC}"
fi

# Remove old image to force rebuild
echo -e "${YELLOW}🗑️  Removing old image...${NC}"
if docker images -q "$IMAGE_NAME" | grep -q .; then
    docker rmi "$IMAGE_NAME" 2>/dev/null || true
    echo -e "${GREEN}✅ Old image removed${NC}"
else
    echo -e "${YELLOW}ℹ️  No existing image found${NC}"
fi

# Clean up unused Docker resources
echo -e "${YELLOW}🧹 Cleaning up unused Docker resources...${NC}"
docker system prune -a -f  # Removes ALL unused images, not just dangling ones
docker volume prune -f     # Removes unused volumes
docker network prune -f    # Removes unused networks
echo -e "${GREEN}✅ Docker cleanup completed${NC}"

# Build new image
echo -e "${YELLOW}🔨 Building new Docker image...${NC}"
docker build -t "$IMAGE_NAME" .
echo -e "${GREEN}✅ Docker image built successfully${NC}"

# Run new container
echo -e "${YELLOW}🚀 Starting new container...${NC}"
docker run -d \
    --name "$CONTAINER_NAME" \
    -p "$PORT:$PORT" \
    --restart unless-stopped \
    --env-file .env \
    "$IMAGE_NAME"

echo -e "${GREEN}✅ Container started successfully${NC}"

# Wait a moment for container to start
echo -e "${YELLOW}⏳ Waiting for container to start...${NC}"
sleep 5

# Check container status
echo -e "${BLUE}📊 Container status:${NC}"
docker ps -f name="$CONTAINER_NAME"

# Check container logs
echo -e "${BLUE}📋 Recent container logs:${NC}"
docker logs --tail 20 "$CONTAINER_NAME"

# Systemd service setup section
echo -e "${BLUE}⚙️  Setting up systemd service...${NC}"

# Copy service file to systemd directory
echo -e "${YELLOW}📁 Copying service file...${NC}"
sudo cp "service_files/$SERVICE_FILE" "/etc/systemd/system/"

# Make setup script executable
chmod +x "service_files/$SETUP_SCRIPT"

# Run the setup script from the backend directory (where service files are)
echo -e "${YELLOW}🔧 Running systemd setup script...${NC}"
echo -e "${BLUE}📁 Current directory: $(pwd)${NC}"
echo -e "${BLUE}📁 Service file path: service_files/$SETUP_SCRIPT${NC}"
sudo "service_files/$SETUP_SCRIPT"

# Reload systemd daemon
echo -e "${YELLOW}🔄 Reloading systemd daemon...${NC}"
sudo systemctl daemon-reload

# Enable the service
echo -e "${YELLOW}⚡ Enabling service...${NC}"
sudo systemctl enable "$SERVICE_NAME"

# Check service status
echo -e "${BLUE}📊 Service status:${NC}"
sudo systemctl status "$SERVICE_NAME" --no-pager

# Final status check
echo -e "${BLUE}🎯 Final Status Check${NC}"
echo "========================"

# Check if container is running
if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
    echo -e "${GREEN}✅ Docker container is running${NC}"
else
    echo -e "${RED}❌ Docker container is not running${NC}"
fi

# Check if service is enabled
if systemctl is-enabled "$SERVICE_NAME" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Systemd service is enabled${NC}"
else
    echo -e "${RED}❌ Systemd service is not enabled${NC}"
fi

# Test health endpoint
echo -e "${YELLOW}🏥 Testing health endpoint...${NC}"
if curl -f -s "http://localhost:$PORT/health/" >/dev/null; then
    echo -e "${GREEN}✅ Health endpoint is responding${NC}"
else
    echo -e "${RED}❌ Health endpoint is not responding${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo -e "${BLUE}📋 Management Commands:${NC}"
echo "  Docker container:"
echo "    View logs:     docker logs -f $CONTAINER_NAME"
echo "    Stop:          docker stop $CONTAINER_NAME"
echo "    Start:         docker start $CONTAINER_NAME"
echo "    Restart:       docker restart $CONTAINER_NAME"
echo ""
echo "  Systemd service:"
echo "    View logs:     sudo journalctl -u $SERVICE_NAME -f"
echo "    Start:         sudo systemctl start $SERVICE_NAME"
echo "    Stop:          sudo systemctl stop $SERVICE_NAME"
echo "    Restart:       sudo systemctl restart $SERVICE_NAME"
echo "    Status:        sudo systemctl status $SERVICE_NAME"
echo ""
echo -e "${BLUE}🌐 Application URLs:${NC}"
echo "  Health check:    http://localhost:$PORT/health/"
echo "  API docs:        http://localhost:$PORT/docs"
echo "  API root:        http://localhost:$PORT/"
