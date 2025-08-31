# WanderSphere Deployment Guide

## 🚀 Live Application

- **Backend (Render):** https://wander-sphere-ue7e.onrender.com
- **Frontend:** Ready for Vercel deployment

## 📋 Environment Variables for Vercel

To ensure your Vercel deployment works correctly, add these environment variables in your Vercel dashboard:

### Required Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=https://wander-sphere-ue7e.onrender.com
VITE_API_TIMEOUT=20000
VITE_ENABLE_API_LOGGING=false

# Authentication
VITE_JWT_SECRET=your_jwt_secret_here
VITE_TOKEN_EXPIRY=24h

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
VITE_APP_NAME=WanderSphere
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_ENABLE_REAL_TIME_CHAT=true
```

**Note:** Replace placeholder values with your actual credentials. Never commit real credentials to version control.

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

### Status: ✅ Successfully Deployed

The backend is successfully deployed and operational at https://wander-sphere-ue7e.onrender.com

### Required Environment Variables for Render

Set these in your Render dashboard under Environment Variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=10000
FRONTEND_URL=your_frontend_url

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=10485760
MAX_FILES_PER_REQUEST=5
```

**Note:** Replace placeholder values with your actual credentials.

### Render Service Configuration

1. **Build Command**: `cd backend && npm install`
2. **Start Command**: `cd backend && npm start`
3. **Environment**: Node
4. **Health Check Path**: `/health`

### Verification Steps

1. **Test API Endpoints**: Verify backend is responding at `https://wander-sphere-ue7e.onrender.com/api/auth/test`
2. **Check Environment Variables**: Ensure all required variables are set in Render dashboard
3. **Monitor Service Logs**: Check Render service logs for any issues
4. **Verify Database Connection**: Ensure Supabase connection is working properly

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
   - Verify `VITE_API_BASE_URL` is set to `https://wander-sphere-ue7e.onrender.com` (without `/api` suffix)
   - Check that backend is running at https://wander-sphere-ue7e.onrender.com
   - Test API endpoints at https://wander-sphere-ue7e.onrender.com/api/auth/test

2. **Authentication Issues:**
   - Ensure Supabase credentials are correctly set
   - Verify JWT secret matches between frontend and backend

3. **CORS Errors:**
   - Backend is configured to allow requests from frontend domains
   - Update `FRONTEND_URL` in Render environment variables if needed

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

- `/api/auth` - Authentication
- `/api/users` - User management
- `/api/trips` - Trip operations
- `/api/clubs` - Travel clubs
- `/api/journeys` - Journey sharing
- `/api/budget` - Budget tracking
- `/api/booking` - Booking services
- `/api/notifications` - Real-time notifications
- `/api/search` - Search functionality
- `/api/media` - File uploads
- `/api/map` - Map services

## 🔄 Redeployment

To redeploy after changes:
1. Push changes to your GitHub repository
2. Vercel will automatically trigger a new deployment
3. Monitor the deployment in Vercel dashboard

---

**Your WanderSphere application is now live and fully functional! 🎉**