#!/bin/bash
# SSL Setup Script for EC2 Backend
# Run this on your EC2 instance after DNS is configured

set -e

echo "🔒 Setting up SSL for api.mayhouse.in"
echo "======================================"

# Install Certbot
echo "📦 Installing Certbot..."
sudo yum update -y
sudo yum install -y certbot python3-certbot-nginx

# Install Nginx if not already installed
echo "📦 Installing Nginx..."
sudo yum install -y nginx

# Create Nginx configuration for the backend
echo "⚙️  Configuring Nginx..."
sudo tee /etc/nginx/conf.d/mayhouse-backend.conf > /dev/null << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.mayhouse.in;

    # Allow Certbot to verify domain
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name api.mayhouse.in;

    # SSL certificates (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.mayhouse.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.mayhouse.in/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Proxy to backend application
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for long-running requests
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # Health check endpoint
    location /health/ {
        proxy_pass http://localhost:8000/health/;
        access_log off;
    }
}
EOF

# Create directory for Certbot verification
sudo mkdir -p /var/www/certbot

# Test Nginx configuration
echo "✅ Testing Nginx configuration..."
sudo nginx -t

# Start and enable Nginx
echo "🚀 Starting Nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx

# Wait for DNS to propagate
echo "⏳ Waiting for DNS to propagate..."
echo "   Please verify that 'api.mayhouse.in' points to this server"
echo "   Run: nslookup api.mayhouse.in"
read -p "   Press Enter when DNS is ready..."

# Obtain SSL certificate
echo "🔐 Obtaining SSL certificate from Let's Encrypt..."
sudo certbot certonly --nginx \
    -d api.mayhouse.in \
    --non-interactive \
    --agree-tos \
    --email your-email@example.com \
    --redirect

# Reload Nginx with SSL
echo "🔄 Reloading Nginx with SSL..."
sudo systemctl reload nginx

# Set up auto-renewal
echo "⏰ Setting up SSL auto-renewal..."
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer

# Test SSL certificate renewal
echo "✅ Testing SSL renewal..."
sudo certbot renew --dry-run

echo ""
echo "🎉 SSL setup complete!"
echo ""
echo "Your backend is now accessible at:"
echo "  https://api.mayhouse.in"
echo ""
echo "Next steps:"
echo "1. Update backend .env: OAUTH_REDIRECT_URI=https://api.mayhouse.in/auth/oauth/google/callback"
echo "2. Update Vercel: NEXT_PUBLIC_API_BASE_URL=https://api.mayhouse.in"
echo "3. Update Google OAuth Console with new URLs"
echo "4. Restart your backend: sudo systemctl restart mayhouse-backend"

