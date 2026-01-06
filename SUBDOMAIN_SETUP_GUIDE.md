# Complete Subdomain Setup Guide for Mayhouse Backend

## 🎯 Goal
Set up `api.mayhouse.in` as the subdomain for your EC2 backend with SSL

## 📊 Current Setup
- **EC2 IP**: `18.223.166.226`
- **EC2 DNS**: `ec2-18-223-166-226.us-east-2.compute.amazonaws.com`
- **Frontend**: `https://mayhouse.in` (Vercel)
- **Target Backend URL**: `https://api.mayhouse.in`

---

## 🚀 Quick Start (5 Steps)

### **Step 1: Configure DNS (5 minutes)**

Go to your DNS provider (where you bought `mayhouse.in`) and add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | api | 18.223.166.226 | 3600 |

**Wait 5-10 minutes** for DNS to propagate, then verify:
```bash
nslookup api.mayhouse.in
# Should show: 18.223.166.226
```

---

### **Step 2: Copy SSL Setup Script to EC2**

From your local machine:
```bash
# Copy the setup script to EC2
scp -i ~/your-key.pem ~/post-hackathon/mayhouse/backend/setup_ssl.sh \
    ec2-user@ec2-18-223-166-226.us-east-2.compute.amazonaws.com:~/
```

---

### **Step 3: Run SSL Setup on EC2**

SSH into EC2 and run the script:
```bash
# SSH into EC2
ssh -i ~/your-key.pem ec2-user@ec2-18-223-166-226.us-east-2.compute.amazonaws.com

# Make script executable
chmod +x setup_ssl.sh

# Edit the script to add your email (required for Let's Encrypt)
nano setup_ssl.sh
# Find: --email your-email@example.com
# Change to: --email your-actual-email@example.com

# Run the setup script
sudo ./setup_ssl.sh
```

**Important:** When prompted, press Enter only after verifying DNS is working (`nslookup api.mayhouse.in`)

---

### **Step 4: Update Backend Configuration on EC2**

Still on EC2, update the backend `.env` file:
```bash
# Find your backend directory (likely one of these):
cd /home/ec2-user/mayhouse-backend
# OR
cd /opt/mayhouse/backend

# Edit .env
sudo nano .env

# Update these two lines:
OAUTH_REDIRECT_URI=https://api.mayhouse.in/auth/oauth/google/callback
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://mayhouse.in,https://www.mayhouse.in

# Save (Ctrl+O, Enter, Ctrl+X)

# Restart backend
sudo systemctl restart mayhouse-backend
# OR if using Docker:
sudo docker restart mayhouse-backend-container

# Verify it's running
curl https://api.mayhouse.in/health/
# Should return: {"status":"healthy"}
```

---

### **Step 5: Update Vercel & Google OAuth**

#### **A. Update Vercel Environment Variable:**
1. Go to https://vercel.com/dashboard
2. Select your `mayhouse` project
3. **Settings** → **Environment Variables**
4. Edit `NEXT_PUBLIC_API_BASE_URL`
5. Change value to: `https://api.mayhouse.in`
6. Click **Save**
7. Go to **Deployments** → Click **"Redeploy"** on latest deployment

#### **B. Update Google OAuth Console:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Under **"Authorized JavaScript origins"**, add:
   ```
   https://api.mayhouse.in
   ```
4. Under **"Authorized redirect URIs"**, add:
   ```
   https://api.mayhouse.in/auth/oauth/google/callback
   ```
5. Click **"Save"**

---

## ✅ Testing

After everything is set up, test the complete flow:

### 1. Test Backend:
```bash
curl https://api.mayhouse.in/health/
# Should return: {"status":"healthy"}
```

### 2. Test SSL:
```bash
curl -I https://api.mayhouse.in/health/
# Should show: HTTP/2 200
```

### 3. Test OAuth Flow:
1. Open https://mayhouse.in/login
2. Click "Sign in with Google"
3. Complete Google login
4. Should redirect back to your app successfully

---

## 🔧 Troubleshooting

### DNS not resolving?
```bash
# Check DNS
nslookup api.mayhouse.in

# If it doesn't show 18.223.166.226, wait longer or check DNS provider
```

### SSL certificate failed?
```bash
# Check if DNS is working first
nslookup api.mayhouse.in

# Check Nginx is running
sudo systemctl status nginx

# Check certificate
sudo certbot certificates

# Try to renew manually
sudo certbot renew --force-renewal
```

### Backend not responding?
```bash
# Check if backend is running
sudo systemctl status mayhouse-backend
# OR
sudo docker ps | grep mayhouse

# Check backend logs
sudo journalctl -u mayhouse-backend -f
# OR
sudo docker logs -f mayhouse-backend-container

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### OAuth still failing?
1. Check Google OAuth Console URLs are correct
2. Check backend `.env` has correct OAUTH_REDIRECT_URI
3. Check Vercel has correct NEXT_PUBLIC_API_BASE_URL
4. Clear browser cache and cookies
5. Check backend logs: `sudo journalctl -u mayhouse-backend -f`

---

## 📝 Summary of URLs

After setup, your URLs will be:

| Service | URL |
|---------|-----|
| Frontend (Production) | https://mayhouse.in |
| Frontend (www) | https://www.mayhouse.in |
| Backend API | https://api.mayhouse.in |
| OAuth Callback | https://api.mayhouse.in/auth/oauth/google/callback |
| Frontend Callback | https://mayhouse.in/auth/callback |
| Health Check | https://api.mayhouse.in/health/ |
| API Docs | https://api.mayhouse.in/docs |

---

## 🎉 Done!

Once all tests pass, your Google Sign-In should work perfectly with:
- Frontend: `https://mayhouse.in` (Vercel)
- Backend: `https://api.mayhouse.in` (EC2 with SSL)
- OAuth flow properly configured

