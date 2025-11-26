# Production Deployment Checklist

## ✅ Pre-Deployment Configuration

### Frontend (Vercel) - Environment Variables

Set these in **Vercel Dashboard** → **Settings** → **Environment Variables**:

```
VITE_API_BASE_URL=https://wander-sphere-ue7e.onrender.com
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_TIMEOUT=15000
VITE_ENABLE_API_LOGGING=false
```

**Important:** 
- ✅ Variables must start with `VITE_` to be included in the build
- ✅ Set for **Production** environment
- ✅ Vercel will automatically redeploy after saving

### Backend (Render) - Environment Variables

Set these in **Render Dashboard** → **Environment** tab:

```
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://wander-sphere-zpml.vercel.app
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
MAX_FILES_PER_REQUEST=5
```

## 📋 Code Configuration Status

### ✅ Frontend (`src/config/api.ts`)
- ✅ Automatically uses production URL when building for production
- ✅ Falls back to localhost for local development
- ✅ Environment variables can override defaults

### ✅ Backend (`backend/server.js`)
- ✅ CORS configured for production frontend URL
- ✅ Allows localhost for development
- ✅ Production mode restricts CORS to allowed origins only

### ✅ Backend Config (`backend/config/env.js`)
- ✅ Defaults to production frontend URL in production
- ✅ Defaults to localhost in development

## 🚀 Deployment Steps

### Step 1: Verify Environment Variables

**Vercel:**
1. Go to: https://vercel.com/dashboard
2. Select project: `wander-sphere-zpml`
3. Settings → Environment Variables
4. Verify all `VITE_*` variables are set

**Render:**
1. Go to: https://dashboard.render.com
2. Select service: `wander-sphere-backend`
3. Environment tab
4. Verify all variables are set

### Step 2: Test Locally (Optional)

```bash
# Test frontend
npm run dev
# Should connect to localhost:5000

# Test production build
npm run build
npm run preview
# Should use production URL
```

### Step 3: Commit and Push

```bash
git add .
git commit -m "Configure for production deployment"
git push origin main
```

### Step 4: Monitor Deployments

**Vercel:**
- Dashboard → Deployments
- Wait for build to complete (1-3 minutes)
- Check logs for any errors

**Render:**
- Dashboard → Service Logs
- Wait for deployment (2-5 minutes)
- Check health endpoint: https://wander-sphere-ue7e.onrender.com/health

### Step 5: Verify Deployment

1. **Frontend:** https://wander-sphere-zpml.vercel.app/
   - Open browser console (F12)
   - Check Network tab
   - API calls should go to: `wander-sphere-ue7e.onrender.com`

2. **Backend:** https://wander-sphere-ue7e.onrender.com/health
   - Should return: `{"status":"OK",...}`

3. **Test Login:**
   - Try logging in on production
   - Verify API calls work
   - Check for CORS errors in console

## 🔍 Troubleshooting

### Frontend Not Connecting to Backend

**Symptoms:**
- CORS errors in browser console
- Network requests failing
- 401/403 errors

**Solutions:**
1. Check Vercel environment variables
2. Verify `VITE_API_BASE_URL` is set correctly
3. Check backend CORS configuration
4. Verify backend is running: https://wander-sphere-ue7e.onrender.com/health

### Backend CORS Errors

**Symptoms:**
- `Access-Control-Allow-Origin` errors
- Requests blocked by browser

**Solutions:**
1. Check Render environment variables
2. Verify `FRONTEND_URL` matches Vercel URL exactly
3. Check backend logs for CORS warnings
4. Ensure frontend URL is in `allowedOrigins` array

### Environment Variables Not Working

**Vercel:**
- Variables must start with `VITE_`
- Must be set for **Production** environment
- Redeploy after adding variables

**Render:**
- Restart service after adding variables
- Check variable names match exactly
- Verify no typos in values

## 📊 Production URLs

### Frontend
- **URL:** https://wander-sphere-zpml.vercel.app/
- **Platform:** Vercel
- **Auto-deploy:** Yes (from GitHub main branch)

### Backend
- **URL:** https://wander-sphere-ue7e.onrender.com
- **Health Check:** https://wander-sphere-ue7e.onrender.com/health
- **Platform:** Render
- **Auto-deploy:** Yes (from GitHub main branch)

## 🔄 Auto-Deployment Flow

```
GitHub Push (main branch)
    ↓
    ├─→ Vercel detects push
    │   ├─→ Runs `npm install`
    │   ├─→ Runs `npm run build`
    │   ├─→ Uses Vercel env vars
    │   └─→ Deploys to Vercel
    │
    └─→ Render detects push
        ├─→ Runs `npm install` (in backend/)
        ├─→ Runs `npm start`
        ├─→ Uses Render env vars
        └─→ Deploys to Render
```

## ✅ Final Checklist

Before pushing to production:

- [ ] All environment variables set in Vercel
- [ ] All environment variables set in Render
- [ ] Code changes committed
- [ ] Tested locally (optional)
- [ ] Ready to push to `main` branch
- [ ] Monitor deployment logs
- [ ] Verify production URLs work
- [ ] Test login/authentication
- [ ] Check for console errors

## 🎉 After Deployment

1. **Test the application:**
   - Visit: https://wander-sphere-zpml.vercel.app/
   - Try logging in
   - Test key features

2. **Monitor:**
   - Check Vercel/Render logs
   - Monitor error rates
   - Check user feedback

3. **Update Documentation:**
   - Update README with production URLs
   - Document any issues found

## 📝 Notes

- ⚠️ **Never commit `.env` files** with real secrets
- ✅ **Use environment variables** for all sensitive data
- 🔄 **Auto-deployment** happens automatically on push
- 📊 **Monitor logs** for the first few deployments
- 🧪 **Test thoroughly** after deployment

