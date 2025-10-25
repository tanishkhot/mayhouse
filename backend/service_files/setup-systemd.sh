#!/bin/bash

# Mayhouse Backend Systemd Service Setup Script (ETH Online Hackathon)
# Run this script on your EC2 server to install and configure the service

set -e

echo "🚀 Setting up Mayhouse Backend (ETH Online Hackathon) as a systemd service..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="mayhouse-backend"
SERVICE_FILE="mayhouse-backend.service"
CURRENT_DIR=$(pwd)
SYSTEMD_DIR="/etc/systemd/system"

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root or with sudo${NC}"
   exit 1
fi

# Check if service file exists in current directory or service_files subdirectory
if [[ -f "$SERVICE_FILE" ]]; then
    SERVICE_FILE_PATH="$SERVICE_FILE"
elif [[ -f "service_files/$SERVICE_FILE" ]]; then
    SERVICE_FILE_PATH="service_files/$SERVICE_FILE"
else
    echo -e "${RED}❌ Service file $SERVICE_FILE not found in current directory or service_files/ subdirectory${NC}"
    echo -e "${YELLOW}   Current directory: $CURRENT_DIR${NC}"
    echo -e "${YELLOW}   Looking for: $SERVICE_FILE or service_files/$SERVICE_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Current setup:${NC}"
echo "   Service name: $SERVICE_NAME"
echo "   Service file: $SERVICE_FILE_PATH"
echo "   Current directory: $CURRENT_DIR"
echo "   Systemd directory: $SYSTEMD_DIR"

# Copy service file to systemd directory
echo -e "${YELLOW}📁 Installing service file...${NC}"
cp "$SERVICE_FILE_PATH" "$SYSTEMD_DIR/"

# Reload systemd daemon
echo -e "${YELLOW}🔄 Reloading systemd daemon...${NC}"
systemctl daemon-reload

# Enable the service (start on boot)
echo -e "${YELLOW}⚡ Enabling service to start on boot...${NC}"
systemctl enable "$SERVICE_NAME"

echo -e "${GREEN}✅ Service installed and enabled successfully!${NC}"
echo ""
echo -e "${YELLOW}🎮 Management commands:${NC}"
echo "   Start service:    sudo systemctl start $SERVICE_NAME"
echo "   Stop service:     sudo systemctl stop $SERVICE_NAME"
echo "   Restart service:  sudo systemctl restart $SERVICE_NAME"
echo "   Check status:     sudo systemctl status $SERVICE_NAME"
echo "   View logs:        sudo journalctl -u $SERVICE_NAME -f"
echo "   View recent logs: sudo journalctl -u $SERVICE_NAME --since '1 hour ago'"
echo ""
echo -e "${YELLOW}📊 Service status:${NC}"
systemctl status "$SERVICE_NAME" --no-pager

echo ""
echo -e "${GREEN}🎉 Setup complete! You can now manage your Mayhouse backend with systemctl commands.${NC}"
