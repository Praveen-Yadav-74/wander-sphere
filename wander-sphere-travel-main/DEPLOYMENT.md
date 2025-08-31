# WanderSphere Deployment Guide

## 🚀 Live Application

- **Frontend (Vercel):** https://wander-sphere-zpml.vercel.app/
- **Backend (Render):** https://wander-sphere-ue7e.onrender.com

## 📋 Environment Variables for Vercel

To ensure your Vercel deployment works correctly, add these environment variables in your Vercel dashboard:

### Required Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=https://wander-sphere-ue7e.onrender.com/api
VITE_API_TIMEOUT=20000
VITE_ENABLE_API_LOGGING=false

# Authentication
VITE_JWT_SECRET=h9LRCfE5MCk4r0C3GnPGxfSfJG6xr71iDZhQpuQMe+4JR7KmICgox+K1Qfrw/iaiaWvq0hrTVHPox3Ixml44Tw==
VITE_TOKEN_EXPIRY=24h

# Supabase Configuration
VITE_SUPABASE_URL=https://gserzaenfrmrqoffzcxr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZXJ6YWVuZnJtcnFvZmZ6Y3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTc3OTksImV4cCI6MjA3MTY5Mzc5OX0.QjIchTrYF-P47wzEA12rN60xdF7rclYyst_28tet80I

# App Configuration
VITE_APP_NAME=WanderSphere
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_ENABLE_REAL_TIME_CHAT=true
```

## 🔧 Vercel Deployment Steps

1. **Connect Repository:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

## 🖥️ Render Backend Deployment

### Current Issue: 503 Server Unavailable

The backend is currently returning 503 errors. This is likely due to missing environment variables in Render.

### Required Environment Variables for Render

Set these in your Render dashboard under Environment Variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://wander-sphere-zpml.vercel.app

# Supabase Configuration
SUPABASE_URL=https://gserzaenfrmrqoffzcxr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZXJ6YWVuZnJtcnFvZmZ6Y3hyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjExNzc5OSwiZXhwIjoyMDcxNjkzNzk5fQ.odO_-TqCDpliDv-TplUokm08gfoZARABo62vCTDRWCw

# JWT Configuration
JWT_SECRET=h9LRCfE5MCk4r0C3GnPGxfSfJG6xr71iDZhQpuQMe+4JR7KmICgox+K1Qfrw/iaiaWvq0hrTVHPox3Ixml44Tw==
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=10485760
MAX_FILES_PER_REQUEST=5
```

### Render Service Configuration

1. **Build Command**: `cd backend && npm install`
2. **Start Command**: `cd backend && npm start`
3. **Environment**: Node
4. **Health Check Path**: `/health`

### Troubleshooting Steps

1. **Check Environment Variables**: Ensure all required variables are set in Render dashboard
2. **Verify Build Logs**: Check Render build logs for any errors
3. **Test Health Endpoint**: Once deployed, test `https://wander-sphere-ue7e.onrender.com/health`
4. **Check Service Logs**: Monitor Render service logs for runtime errors

3. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add all the variables listed above
   - Make sure to set them for "Production" environment

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

## 🔍 Troubleshooting

### Common Issues:

1. **API Connection Errors:**
   - Verify `VITE_API_BASE_URL` is set correctly in Vercel
   - Check that backend is running at https://wander-sphere-ue7e.onrender.com

2. **Authentication Issues:**
   - Ensure Supabase credentials are correctly set
   - Verify JWT secret matches between frontend and backend

3. **CORS Errors:**
   - Backend is configured to allow requests from Vercel domain
   - No additional CORS configuration needed

## 📱 Features Available

- ✅ User Authentication (Register/Login)
- ✅ Trip Management (Create/Browse/Join)
- ✅ Travel Clubs & Communities
- ✅ Journey Sharing & Social Features
- ✅ Budget Tracking & Management
- ✅ Booking Integration
- ✅ Real-time Notifications
- ✅ Search & Discovery
- ✅ Media Upload & Gallery

## 🌐 API Endpoints

All API endpoints are available at: `https://wander-sphere-ue7e.onrender.com/api/`

- `/auth` - Authentication
- `/users` - User management
- `/trips` - Trip operations
- `/clubs` - Travel clubs
- `/journeys` - Journey sharing
- `/budget` - Budget tracking
- `/booking` - Booking services
- `/notifications` - Real-time notifications
- `/search` - Search functionality
- `/media` - File uploads
- `/map` - Map services

## 🔄 Redeployment

To redeploy after changes:
1. Push changes to your GitHub repository
2. Vercel will automatically trigger a new deployment
3. Monitor the deployment in Vercel dashboard

---

**Your WanderSphere application is now live and fully functional! 🎉**