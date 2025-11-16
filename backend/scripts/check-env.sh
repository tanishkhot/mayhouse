#!/bin/bash

# Script to check if required environment variables are set on the backend

echo "🔍 Checking Backend Environment Variables..."
echo "=========================================="
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
    echo ""
    echo "Checking required variables:"
    echo "----------------------------"
    
    # Check SUPABASE_URL
    if grep -q "SUPABASE_URL=" .env && ! grep -q "SUPABASE_URL=your-project" .env && ! grep -q "SUPABASE_URL=$" .env; then
        SUPABASE_URL=$(grep "SUPABASE_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
        if [ -n "$SUPABASE_URL" ] && [ "$SUPABASE_URL" != "" ]; then
            echo "✅ SUPABASE_URL is set: ${SUPABASE_URL:0:30}..."
        else
            echo "❌ SUPABASE_URL is empty"
        fi
    else
        echo "❌ SUPABASE_URL is not set or is placeholder"
    fi
    
    # Check SUPABASE_ANON_KEY
    if grep -q "SUPABASE_ANON_KEY=" .env && ! grep -q "SUPABASE_ANON_KEY=your-anon-key" .env && ! grep -q "SUPABASE_ANON_KEY=$" .env; then
        SUPABASE_ANON_KEY=$(grep "SUPABASE_ANON_KEY=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
        if [ -n "$SUPABASE_ANON_KEY" ] && [ "$SUPABASE_ANON_KEY" != "" ]; then
            echo "✅ SUPABASE_ANON_KEY is set: ${SUPABASE_ANON_KEY:0:20}..."
        else
            echo "❌ SUPABASE_ANON_KEY is empty"
        fi
    else
        echo "❌ SUPABASE_ANON_KEY is not set or is placeholder"
    fi
    
    # Check SUPABASE_SERVICE_KEY
    if grep -q "SUPABASE_SERVICE_KEY=" .env && ! grep -q "SUPABASE_SERVICE_KEY=your-service-key" .env && ! grep -q "SUPABASE_SERVICE_KEY=$" .env; then
        SUPABASE_SERVICE_KEY=$(grep "SUPABASE_SERVICE_KEY=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
        if [ -n "$SUPABASE_SERVICE_KEY" ] && [ "$SUPABASE_SERVICE_KEY" != "" ]; then
            echo "✅ SUPABASE_SERVICE_KEY is set: ${SUPABASE_SERVICE_KEY:0:20}..."
        else
            echo "❌ SUPABASE_SERVICE_KEY is not set or is placeholder"
        fi
    else
        echo "❌ SUPABASE_SERVICE_KEY is not set or is placeholder"
    fi
    
    # Check JWT_SECRET_KEY
    if grep -q "JWT_SECRET_KEY=" .env && ! grep -q "JWT_SECRET_KEY=your-secret-key-change-in-production" .env && ! grep -q "JWT_SECRET_KEY=$" .env; then
        JWT_SECRET_KEY=$(grep "JWT_SECRET_KEY=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
        if [ -n "$JWT_SECRET_KEY" ] && [ "$JWT_SECRET_KEY" != "" ]; then
            echo "✅ JWT_SECRET_KEY is set: ${JWT_SECRET_KEY:0:20}..."
        else
            echo "❌ JWT_SECRET_KEY is empty"
        fi
    else
        echo "❌ JWT_SECRET_KEY is not set or is placeholder"
    fi
    
else
    echo "❌ .env file not found"
    echo ""
    echo "Please create a .env file with the required variables:"
    echo "  cp env.example .env"
    echo "  # Then edit .env with your actual values"
fi

echo ""
echo "=========================================="
echo "💡 To fix missing variables:"
echo "  1. Edit .env file with your Supabase credentials"
echo "  2. Restart the backend service:"
echo "     sudo systemctl restart mayhouse-backend"
echo "     # OR if using Docker:"
echo "     docker restart mayhouse-backend-container"

