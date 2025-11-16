#!/bin/bash

# Script to fix the mayhouse-backend systemd service on EC2
# This script updates the service file and restarts the service

set -e

echo "🔧 Fixing Mayhouse Backend Service on EC2"
echo "=========================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  This script needs sudo privileges"
    echo "   Run with: sudo bash fix-ec2-service.sh"
    exit 1
fi

SERVICE_NAME="mayhouse-backend"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
BACKEND_DIR="/home/ec2-user/mayhouse/backend"
SOURCE_SERVICE_FILE="${BACKEND_DIR}/service_files/${SERVICE_NAME}.service"

# Check if source file exists
if [ ! -f "$SOURCE_SERVICE_FILE" ]; then
    echo "❌ Source service file not found: $SOURCE_SERVICE_FILE"
    echo "   Please make sure you're in the backend directory and the file exists"
    exit 1
fi

# Check if .env file exists
if [ ! -f "${BACKEND_DIR}/.env" ]; then
    echo "⚠️  Warning: .env file not found at ${BACKEND_DIR}/.env"
    echo "   The service will fail if .env is not present"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📋 Steps to fix the service:"
echo "   1. Copy service file to systemd directory"
echo "   2. Reload systemd daemon"
echo "   3. Restart the service"
echo ""

# Step 1: Copy service file
echo "📝 Step 1: Copying service file..."
cp "$SOURCE_SERVICE_FILE" "$SERVICE_FILE"
chmod 644 "$SERVICE_FILE"
echo "✅ Service file copied to $SERVICE_FILE"

# Step 2: Reload systemd
echo ""
echo "🔄 Step 2: Reloading systemd daemon..."
systemctl daemon-reload
echo "✅ Systemd daemon reloaded"

# Step 3: Stop existing service if running
echo ""
echo "🛑 Step 3: Stopping existing service (if running)..."
systemctl stop "$SERVICE_NAME" 2>/dev/null || echo "   Service was not running"
echo "✅ Service stopped"

# Step 4: Start the service
echo ""
echo "🚀 Step 4: Starting the service..."
systemctl start "$SERVICE_NAME"
echo "✅ Service started"

# Step 5: Enable service to start on boot
echo ""
echo "⚙️  Step 5: Enabling service to start on boot..."
systemctl enable "$SERVICE_NAME"
echo "✅ Service enabled"

# Step 6: Check status
echo ""
echo "📊 Step 6: Checking service status..."
sleep 2
systemctl status "$SERVICE_NAME" --no-pager -l || true

echo ""
echo "=========================================="
echo "✅ Service fix completed!"
echo ""
echo "📋 Useful commands:"
echo "   View logs:     sudo journalctl -u $SERVICE_NAME -f"
echo "   Check status:  sudo systemctl status $SERVICE_NAME"
echo "   Restart:       sudo systemctl restart $SERVICE_NAME"
echo "   Stop:          sudo systemctl stop $SERVICE_NAME"
echo ""
echo "🧪 Test the service:"
echo "   curl http://localhost:8000/health"
echo ""

