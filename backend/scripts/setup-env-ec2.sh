#!/bin/bash

# Script to help set up environment variables on EC2 instance
# Run this on your EC2 instance after SSH'ing in

set -e

echo "🔧 Mayhouse Backend Environment Setup for EC2"
echo "=============================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ Created .env file"
    else
        echo "❌ env.example not found. Please create .env manually."
        exit 1
    fi
    echo ""
fi

echo "📋 Current .env file location: $(pwd)/.env"
echo ""
echo "⚠️  IMPORTANT: You need to edit the .env file with your actual Supabase credentials"
echo ""
echo "Required variables to set:"
echo "-------------------------"
echo "1. SUPABASE_URL=https://your-project.supabase.co"
echo "2. SUPABASE_ANON_KEY=your-anon-key"
echo "3. SUPABASE_SERVICE_KEY=your-service-key (⚠️ Keep this secret!)"
echo "4. JWT_SECRET_KEY=your-secret-key (generate a secure random string)"
echo ""
echo "To get your Supabase credentials:"
echo "  1. Go to https://supabase.com/dashboard"
echo "  2. Select your project"
echo "  3. Go to Settings → API"
echo "  4. Copy:"
echo "     - Project URL → SUPABASE_URL"
echo "     - anon public key → SUPABASE_ANON_KEY"
echo "     - service_role key → SUPABASE_SERVICE_KEY"
echo ""
echo "To generate a secure JWT secret:"
echo "  python3 -c \"import secrets; print(secrets.token_urlsafe(32))\""
echo ""
read -p "Press Enter when you've updated the .env file..."

# Check if variables are set
echo ""
echo "🔍 Verifying environment variables..."
echo ""

MISSING_VARS=0

if ! grep -q "SUPABASE_URL=https://" .env 2>/dev/null || grep -q "SUPABASE_URL=your-project" .env 2>/dev/null; then
    echo "❌ SUPABASE_URL is not properly set"
    MISSING_VARS=1
else
    echo "✅ SUPABASE_URL is set"
fi

if ! grep -q "SUPABASE_ANON_KEY=eyJ" .env 2>/dev/null || grep -q "SUPABASE_ANON_KEY=your-anon-key" .env 2>/dev/null; then
    echo "❌ SUPABASE_ANON_KEY is not properly set"
    MISSING_VARS=1
else
    echo "✅ SUPABASE_ANON_KEY is set"
fi

if ! grep -q "SUPABASE_SERVICE_KEY=eyJ" .env 2>/dev/null || grep -q "SUPABASE_SERVICE_KEY=your-service-key" .env 2>/dev/null; then
    echo "❌ SUPABASE_SERVICE_KEY is not properly set"
    MISSING_VARS=1
else
    echo "✅ SUPABASE_SERVICE_KEY is set"
fi

if ! grep -q "JWT_SECRET_KEY=" .env 2>/dev/null || grep -q "JWT_SECRET_KEY=your-secret-key-change-in-production" .env 2>/dev/null; then
    echo "❌ JWT_SECRET_KEY is not properly set"
    MISSING_VARS=1
else
    echo "✅ JWT_SECRET_KEY is set"
fi

if [ $MISSING_VARS -eq 1 ]; then
    echo ""
    echo "❌ Some required variables are missing. Please update .env file and run this script again."
    exit 1
fi

echo ""
echo "✅ All required environment variables are set!"
echo ""
echo "🔄 Restarting backend service..."
echo ""

# Try to restart systemd service
if systemctl is-active --quiet mayhouse-backend 2>/dev/null; then
    echo "Restarting systemd service..."
    sudo systemctl restart mayhouse-backend
    echo "✅ Service restarted"
elif docker ps --format '{{.Names}}' | grep -q "mayhouse-backend-container"; then
    echo "Restarting Docker container..."
    docker restart mayhouse-backend-container
    echo "✅ Container restarted"
else
    echo "⚠️  Could not find running backend service. Please restart manually:"
    echo "   - Systemd: sudo systemctl restart mayhouse-backend"
    echo "   - Docker: docker restart mayhouse-backend-container"
fi

echo ""
echo "✅ Setup complete! The backend should now work with authentication."
echo ""
echo "🧪 Test the health endpoint:"
echo "   curl http://localhost:8000/health"
echo ""

