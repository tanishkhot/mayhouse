#!/bin/bash

# Mayhouse Frontend Environment Setup Script
# This script helps you configure the frontend to connect to your AWS EC2 backend

echo "🚀 Setting up Mayhouse Frontend Environment..."

# Create .env.local file
cat > .env.local << EOF
# Mayhouse Frontend Environment Configuration
# This file configures the frontend to connect to your AWS EC2 backend

# Backend API Base URL - Points to your AWS EC2 instance
NEXT_PUBLIC_API_BASE_URL=http://ec2-18-223-166-226.us-east-2.compute.amazonaws.com:8000

# Alternative: You can also use the IP address directly
# NEXT_PUBLIC_API_BASE_URL=http://18.223-166-226.us-east-2.compute.amazonaws.com:8000

# Development vs Production
NODE_ENV=development

# Optional: Enable debug logging
NEXT_PUBLIC_DEBUG=true
EOF

echo "✅ Created .env.local file with AWS EC2 backend URL"
echo "📡 Frontend will now connect to: http://ec2-18-223-166-226.us-east-2.compute.amazonaws.com:8000"
echo ""
echo "🔧 To start the development server:"
echo "   npm run dev"
echo ""
echo "🌐 Your frontend will be available at: http://localhost:3000"
echo "🔗 And it will make API calls to your AWS EC2 backend"
