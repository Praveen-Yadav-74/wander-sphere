# Environment Variables Setup

## Quick Setup Guide

### For Production (Vercel)

**You need to set these in Vercel Dashboard, NOT in a file:**

1. Go to: https://vercel.com/dashboard
2. Select your project: `wander-sphere-zpml`
3. Go to: **Settings** → **Environment Variables**
4. Add these variables:

```
VITE_API_BASE_URL = https://wander-sphere-ue7e.onrender.com
VITE_SUPABASE_URL = (your Supabase URL)
VITE_SUPABASE_ANON_KEY = (your Supabase anon key)
VITE_API_TIMEOUT = 15000
VITE_ENABLE_API_LOGGING = false
```

5. **Redeploy** after adding variables (Vercel will do this automatically)

### For Local Development

Create a `.env.local` file in the root directory (this file is gitignored):

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_TIMEOUT=15000
VITE_ENABLE_API_LOGGING=true
```

## How It Works

The code in `src/config/api.ts` automatically:

1. **First:** Checks for `VITE_API_BASE_URL` environment variable
2. **If not set:** Uses production URL (`https://wander-sphere-ue7e.onrender.com`) when building for production
3. **If not set:** Uses localhost (`http://localhost:5000`) when running in development

## Current Status

✅ **Code is configured** to use production URLs by default when building for production
✅ **Code falls back** to localhost for local development
✅ **Environment variables** can override defaults

## Next Steps

1. **Set environment variables in Vercel** (see above)
2. **Push to GitHub** - Vercel will automatically deploy with new settings
3. **Test** - Visit https://wander-sphere-zpml.vercel.app/ to verify

## Important Notes

- ⚠️ **Never commit `.env.local`** to GitHub (it's in `.gitignore`)
- ✅ **Use `.env.example`** as a template (no real secrets)
- 🔄 **Vercel automatically redeploys** when you push to GitHub
- 🔄 **Render automatically redeploys** when you push to GitHub

