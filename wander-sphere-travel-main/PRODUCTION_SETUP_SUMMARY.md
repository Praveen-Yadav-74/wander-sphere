# Production Setup Summary

## ✅ What I've Done

### 1. Updated API Configuration
- **File:** `src/config/api.ts`
- **Change:** Now automatically uses production URL when building for production
- **Production URL:** `https://wander-sphere-ue7e.onrender.com`
- **Local Development:** Still uses `http://localhost:5000` when running locally

### 2. Created Documentation
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `ENV_SETUP.md` - Environment variables setup guide

## 🔄 How Auto-Deployment Works

### When You Push to GitHub:

1. **Vercel (Frontend) automatically:**
   - Detects push to `main` branch
   - Builds your React app
   - Uses environment variables from Vercel Dashboard
   - Deploys to: https://wander-sphere-zpml.vercel.app/

2. **Render (Backend) automatically:**
   - Detects push to `main` branch
   - Installs dependencies
   - Starts server
   - Deploys to: https://wander-sphere-ue7e.onrender.com

**No manual deployment needed!** Just push to GitHub.

## ⚙️ What You Need to Do

### Step 1: Set Environment Variables in Vercel

1. Go to: https://vercel.com/dashboard
2. Select project: `wander-sphere-zpml`
3. Go to: **Settings** → **Environment Variables**
4. Add these (if not already set):

```
VITE_API_BASE_URL = https://wander-sphere-ue7e.onrender.com
VITE_SUPABASE_URL = (your Supabase URL)
VITE_SUPABASE_ANON_KEY = (your Supabase anon key)
```

5. **Save** - Vercel will automatically redeploy

### Step 2: Verify Backend is Running

Visit: https://wander-sphere-ue7e.onrender.com/health

Should return: `{"status":"ok"}` or similar

### Step 3: Push to GitHub

```bash
git add .
git commit -m "Configure production API URLs"
git push origin main
```

**That's it!** Vercel and Render will automatically deploy.

## 📋 Current Configuration

### API Base URL Logic:

```typescript
// Priority order:
1. VITE_API_BASE_URL env variable (from Vercel)
2. Production URL (if building for production)
3. Localhost (if running locally)
```

### For Local Development:

Create `.env.local` file (gitignored):
```env
VITE_API_BASE_URL=http://localhost:5000
```

### For Production:

Set in Vercel Dashboard (see Step 1 above)

## 🔍 How to Verify

### After Deployment:

1. **Frontend:** Visit https://wander-sphere-zpml.vercel.app/
2. **Open Browser Console (F12)**
3. **Check Network Tab:**
   - API calls should go to: `https://wander-sphere-ue7e.onrender.com/api/...`
   - NOT to `localhost:5000`

### If Something's Wrong:

1. **Check Vercel Environment Variables:**
   - Dashboard → Settings → Environment Variables
   - Verify `VITE_API_BASE_URL` is set correctly

2. **Check Vercel Deployment Logs:**
   - Dashboard → Deployments → Latest → Logs
   - Look for build errors

3. **Check Render Backend:**
   - Visit: https://wander-sphere-ue7e.onrender.com/health
   - Should be online

## 📝 Important Notes

✅ **Code is ready** - Production URLs are configured
✅ **Auto-deploy is enabled** - Just push to GitHub
⚠️ **Set Vercel env vars** - Required for production
✅ **Local dev still works** - Uses localhost automatically

## 🚀 Next Steps

1. ✅ Set environment variables in Vercel (if not done)
2. ✅ Push changes to GitHub
3. ✅ Wait for auto-deployment (1-3 minutes)
4. ✅ Test production URLs
5. ✅ Done!

## 📚 Additional Resources

- See `DEPLOYMENT_GUIDE.md` for detailed information
- See `ENV_SETUP.md` for environment variable details

