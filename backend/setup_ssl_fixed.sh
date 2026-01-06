#!/bin/bash
# SSL Setup Script for EC2 Backend (Fixed)
# Run this on your EC2 instance after DNS is configured

set -e

echo "Setting up SSL for api.mayhouse.in"
echo "======================================"

# Install Certbot
echo "Installing Certbot..."
sudo yum update -y
sudo yum install -y certbot python3-certbot-nginx

# Install Nginx if not already installed
echo "Installing Nginx..."
sudo yum install -y nginx

# STEP 1: Create initial HTTP-only Nginx configuration (for Certbot verification)
echo "Configuring Nginx (HTTP only)..."
sudo tee /etc/nginx/conf.d/mayhouse-backend.conf > /dev/null << 'EOF'
# HTTP Server (for Certbot verification and later redirect to HTTPS)
server {
    listen 80;
    server_name api.mayhouse.in;

    # Allow Certbot to verify domain
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Temporarily allow HTTP traffic to backend
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
    }
}
EOF

# Create directory for Certbot verification
sudo mkdir -p /var/www/certbot

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Start and enable Nginx
echo "Starting Nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx

# Wait a moment for Nginx to start
sleep 2

# STEP 2: Obtain SSL certificate
echo "Obtaining SSL certificate from Let's Encrypt..."
echo "This may take a minute..."
sudo certbot certonly --nginx \
    -d api.mayhouse.in \
    --non-interactive \
    --agree-tos \
    --email your-email@example.com \
    --no-redirect

# STEP 3: Update Nginx configuration to use SSL
echo "Updating Nginx configuration to use SSL..."
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
    listen 443 ssl;
    server_name api.mayhouse.in;

    # SSL certificates
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

# Reload Nginx with SSL
echo "Reloading Nginx with SSL..."
sudo systemctl reload nginx

# Set up auto-renewal
echo "Setting up SSL auto-renewal..."
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer

# Test SSL certificate renewal
echo "Testing SSL renewal..."
sudo certbot renew --dry-run

echo ""
echo "SSL setup complete!"
echo ""
echo "Your backend is now accessible at:"
echo "  https://api.mayhouse.in"
echo ""
echo "Next steps:"
echo "1. Update backend .env: OAUTH_REDIRECT_URI=https://api.mayhouse.in/auth/oauth/google/callback"
echo "2. Update backend .env: CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://mayhouse.in,https://www.mayhouse.in"
echo "3. Restart your backend: sudo systemctl restart mayhouse-backend"
echo "4. Test: curl https://api.mayhouse.in/health/"

