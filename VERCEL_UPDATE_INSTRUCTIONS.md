# Vercel Environment Variable Update

## Step-by-Step Instructions

### 1. Open Vercel Dashboard
Go to: https://vercel.com/dashboard

### 2. Select Your Project
Click on the "mayhouse" project

### 3. Navigate to Environment Variables
- Click "Settings" (top menu)
- Click "Environment Variables" (left sidebar)

### 4. Update the Variable
Find `NEXT_PUBLIC_API_BASE_URL` and:
- Click the three dots (...) next to it
- Click "Edit"
- Change the value to: `https://api.mayhouse.in`
- Make sure it's applied to all environments:
  - ✓ Production
  - ✓ Preview  
  - ✓ Development
- Click "Save"

### 5. Redeploy
- Go to "Deployments" tab
- Click the three dots (...) on the latest deployment
- Click "Redeploy"
- Confirm the redeployment

### 6. Verify
Once deployment completes:
- Visit https://mayhouse.in
- Open browser console
- Check that API requests go to `api.mayhouse.in`

## Current Value
Before: `http://localhost:8000` or `http://ec2-18-223-166-226.us-east-2.compute.amazonaws.com:8000`
After: `https://api.mayhouse.in`

## Why This Change?
- Enables HTTPS for secure API communication
- Uses friendly subdomain instead of raw EC2 URL
- SSL certificate is already configured and working
- Consistent with production architecture

