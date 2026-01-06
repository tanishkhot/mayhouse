#!/bin/bash
# Script to update .env file with production settings
# Run this on EC2 after copying it there

set -e

echo "Updating backend .env for production..."

# Backup current .env
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "Backed up current .env"
fi

# Update OAUTH_REDIRECT_URI
if grep -q "^OAUTH_REDIRECT_URI=" .env; then
    sed -i 's|^OAUTH_REDIRECT_URI=.*|OAUTH_REDIRECT_URI=https://api.mayhouse.in/auth/oauth/google/callback|' .env
    echo "Updated OAUTH_REDIRECT_URI"
else
    echo "OAUTH_REDIRECT_URI=https://api.mayhouse.in/auth/oauth/google/callback" >> .env
    echo "Added OAUTH_REDIRECT_URI"
fi

# Update CORS_ORIGINS
if grep -q "^CORS_ORIGINS=" .env; then
    sed -i 's|^CORS_ORIGINS=.*|CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://mayhouse.in,https://www.mayhouse.in,https://mayhouse-git-main-tanishkhots-projects.vercel.app|' .env
    echo "Updated CORS_ORIGINS"
else
    echo "CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://mayhouse.in,https://www.mayhouse.in,https://mayhouse-git-main-tanishkhots-projects.vercel.app" >> .env
    echo "Added CORS_ORIGINS"
fi

echo ""
echo "Environment variables updated successfully!"
echo "New values:"
echo "  OAUTH_REDIRECT_URI=https://api.mayhouse.in/auth/oauth/google/callback"
echo "  CORS_ORIGINS=http://localhost:3000,...,https://mayhouse.in,https://www.mayhouse.in,..."
echo ""
echo "Restart your backend service to apply changes:"
echo "  sudo systemctl restart mayhouse-backend"
echo "  OR: sudo docker restart mayhouse-backend-container"

