# Update .env.example Files - Instructions

## Quick Update

Since `.env.example` files are protected, use one of these methods:

### Method 1: Run the PowerShell Script (Recommended)

```powershell
# In the root directory
.\update-env-files.ps1
```

This script will:
- ✅ Update `backend/.env.example` with production frontend URL
- ✅ Create `.env.example` in root if it doesn't exist
- ✅ Set all production URLs correctly

### Method 2: Manual Update

#### Backend .env.example

Open `backend/.env.example` and change:

```diff
- FRONTEND_URL=https://your-frontend-domain.vercel.app
+ FRONTEND_URL=https://wander-sphere-zpml.vercel.app
```

#### Frontend .env.example

Create `.env.example` in the root directory with:

```env
# WanderSphere Environment Variables
VITE_API_BASE_URL=https://wander-sphere-ue7e.onrender.com
VITE_API_TIMEOUT=15000
VITE_ENABLE_API_LOGGING=false
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## What Needs to Be Updated

### ✅ Production URLs (Required)
- **Backend Frontend URL:** `https://wander-sphere-zpml.vercel.app`
- **Frontend API URL:** `https://wander-sphere-ue7e.onrender.com`

### ✅ Already Updated (Code)
- `src/config/api.ts` - Uses production URL in production builds
- `backend/server.js` - CORS allows production frontend
- `backend/config/env.js` - Defaults to production URLs

### ⚠️ Needs Manual Update (Files)
- `backend/.env.example` - Update `FRONTEND_URL`
- `.env.example` - Create with production URLs

## After Updating

1. **Commit the changes:**
   ```bash
   git add .env.example backend/.env.example
   git commit -m "Update .env.example files with production URLs"
   ```

2. **Push to GitHub:**
   ```bash
   git push origin main
   ```

## Verification

After updating, verify:
- ✅ `backend/.env.example` has `FRONTEND_URL=https://wander-sphere-zpml.vercel.app`
- ✅ `.env.example` exists with `VITE_API_BASE_URL=https://wander-sphere-ue7e.onrender.com`
- ✅ Both files are committed to Git

