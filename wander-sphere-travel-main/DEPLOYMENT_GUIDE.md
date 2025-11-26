# Deployment Guide - WanderSphere

## Overview

This guide explains how the deployment process works for WanderSphere, including how environment variables are managed and how changes are automatically deployed.

## Deployment Architecture

### Backend (Render)
- **Production URL:** https://wander-sphere-ue7e.onrender.com
- **Platform:** Render.com
- **Auto-deploy:** Yes (from GitHub main branch)

### Frontend (Vercel)
- **Production URL:** https://wander-sphere-zpml.vercel.app/
- **Platform:** Vercel
- **Auto-deploy:** Yes (from GitHub main branch)

## Environment Variables

### Frontend (Vercel)

Environment variables are configured in the **Vercel Dashboard**, not in `.env` files that get committed to GitHub.

#### How to Set Environment Variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
VITE_API_BASE_URL=https://wander-sphere-ue7e.onrender.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_TIMEOUT=15000
VITE_ENABLE_API_LOGGING=false
```

#### Important Notes:
- **Never commit `.env` files** with real credentials to GitHub
- Use `.env.example` as a template (credentials removed)
- Vercel automatically uses environment variables during build
- Changes to environment variables require a new deployment

### Backend (Render)

Environment variables are configured in the **Render Dashboard**.

1. Go to your Render service dashboard
2. Navigate to **Environment** tab
3. Add your environment variables (database URLs, API keys, etc.)

## How Auto-Deployment Works

### GitHub → Vercel (Frontend)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Vercel automatically:**
   - Detects the push to `main` branch
   - Runs `npm install` to install dependencies
   - Runs `npm run build` to build the production bundle
   - Uses environment variables from Vercel dashboard
   - Deploys to https://wander-sphere-zpml.vercel.app/

3. **Deployment Time:** Usually 1-3 minutes

### GitHub → Render (Backend)

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Render automatically:**
   - Detects the push to `main` branch
   - Runs `npm install` to install dependencies
   - Starts the server (usually `npm start` or `node server.js`)
   - Deploys to https://wander-sphere-ue7e.onrender.com

3. **Deployment Time:** Usually 2-5 minutes

## Local Development Setup

### For Local Development:

1. **Create `.env.local` file** (this file is gitignored):
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_API_TIMEOUT=15000
   VITE_ENABLE_API_LOGGING=true
   ```

2. **Start Backend:**
   ```bash
   cd backend
   npm install
   npm start
   # Runs on http://localhost:5000
   ```

3. **Start Frontend:**
   ```bash
   npm install
   npm run dev
   # Runs on http://localhost:8080 (or Vite default port)
   ```

### Switching Between Local and Production

The code automatically detects the environment:

- **Development (`npm run dev`):** Uses `http://localhost:5000` (or `.env.local`)
- **Production Build (`npm run build`):** Uses `https://wander-sphere-ue7e.onrender.com` (or Vercel env vars)

## Current Configuration

### API Base URL Logic

The `src/config/api.ts` file uses this logic:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD 
    ? 'https://wander-sphere-ue7e.onrender.com'  // Production fallback
    : 'http://localhost:5000');                  // Development fallback
```

This means:
- If `VITE_API_BASE_URL` is set (from env vars), use that
- Otherwise, use production URL if building for production
- Otherwise, use localhost for development

## Deployment Checklist

Before pushing to GitHub:

- [ ] Update `.env.example` with template values (no real secrets)
- [ ] Ensure `.env.local` is in `.gitignore`
- [ ] Test locally with `npm run dev`
- [ ] Build test with `npm run build`
- [ ] Verify environment variables are set in Vercel dashboard
- [ ] Commit and push to `main` branch

## Troubleshooting

### Frontend Not Connecting to Backend

1. **Check Vercel Environment Variables:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Verify `VITE_API_BASE_URL` is set to `https://wander-sphere-ue7e.onrender.com`

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for API errors
   - Check Network tab for failed requests

3. **Verify Backend is Running:**
   - Visit https://wander-sphere-ue7e.onrender.com/health
   - Should return `{"status":"ok"}`

### Backend Not Deploying

1. **Check Render Logs:**
   - Go to Render Dashboard → Logs
   - Look for build/deployment errors

2. **Verify Build Command:**
   - Check `package.json` for `start` script
   - Ensure it's correct for Render

### Environment Variables Not Working

1. **Vercel:**
   - Environment variables are case-sensitive
   - Must start with `VITE_` for Vite to include them
   - Changes require a new deployment

2. **Render:**
   - Check Environment tab in Render dashboard
   - Restart service after adding new variables

## Quick Reference

### Production URLs
- **Frontend:** https://wander-sphere-zpml.vercel.app/
- **Backend:** https://wander-sphere-ue7e.onrender.com

### Local Development URLs
- **Frontend:** http://localhost:8080 (or Vite default)
- **Backend:** http://localhost:5000

### Git Workflow
```bash
# Make changes locally
git add .
git commit -m "Description of changes"
git push origin main

# Vercel and Render automatically deploy
```

## Important Notes

1. **Never commit secrets** to GitHub
2. **Always use environment variables** for sensitive data
3. **Test locally** before pushing to production
4. **Monitor deployments** in Vercel/Render dashboards
5. **Check logs** if something goes wrong

