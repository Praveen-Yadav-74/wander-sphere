# Local Development Setup Guide

## 🚀 Quick Setup for Local Development

### Step 1: Create Frontend `.env` File

Create a `.env` file in the **root directory** (same level as `package.json`):

```env
# Frontend Environment Variables for Local Development
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_API_TIMEOUT=15000
VITE_ENABLE_API_LOGGING=true
```

### Step 2: Create Backend `.env` File

Create a `.env` file in the **`backend`** directory:

```env
# Backend Environment Variables for Local Development
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:8080

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Etrav API (Optional - for Bus/Flight/Hotel booking)
ETRAV_API_URL=http://api.etrav.in/
ETRAV_CONSUMER_KEY=your_etrav_consumer_key
ETRAV_CONSUMER_SECRET=your_etrav_consumer_secret

# Razorpay (Optional - for wallet payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## 📋 Important URLs

### Local Development:
- **Frontend:** `http://localhost:8080` (or port from Vite config)
- **Backend API:** `http://localhost:5000`

### Production:
- **Frontend:** `https://wander-sphere-zpml.vercel.app`
- **Backend API:** `https://wander-sphere-ue7e.onrender.com`

---

## 🔧 How It Works

### Frontend (`src/config/api.ts`):
- **Checks for `VITE_API_BASE_URL`** in environment variables first
- **If not set**, automatically detects:
  - **Production:** Uses `https://wander-sphere-ue7e.onrender.com`
  - **Development:** Uses `http://localhost:5000`

### Backend (`backend/config/env.js`):
- **Checks for `FRONTEND_URL`** in environment variables
- **If not set**, defaults to:
  - **Production:** `https://wander-sphere-zpml.vercel.app`
  - **Development:** `http://localhost:8080`

---

## ✅ Verification

After setting up `.env` files:

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   Should show: `Server running on port 5000`

2. **Start Frontend:**
   ```bash
   npm run dev
   ```
   Should show: `Local: http://localhost:8080`

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for: `[API Config] Building URL: http://localhost:5000/api/...`
   - If you see `wander-sphere-ue7e.onrender.com`, the `.env` file is not being read

---

## 🐛 Troubleshooting

### Issue: Frontend still connecting to production API

**Solution:**
1. Make sure `.env` file is in the **root directory** (not in `src/`)
2. Restart the dev server: `npm run dev`
3. Check that `VITE_API_BASE_URL=http://localhost:5000` is in `.env`
4. Clear browser cache

### Issue: CORS errors

**Solution:**
1. Make sure backend `.env` has `FRONTEND_URL=http://localhost:8080`
2. Restart backend server
3. Check backend console for CORS logs

### Issue: Environment variables not loading

**Solution:**
1. Make sure file is named exactly `.env` (not `.env.example` or `.env.local`)
2. Restart dev server after creating/modifying `.env`
3. Vite only reads `.env` files at startup

---

## 📝 Notes

- **`.env` files are gitignored** - they won't be committed
- **Never commit real credentials** to Git
- **Use `.env.example`** files as templates
- **Restart servers** after changing `.env` files

---

## 🎯 Summary

The app now **automatically detects** if you're running locally or in production:

- **Local:** Uses `localhost:5000` for backend
- **Production:** Uses `wander-sphere-ue7e.onrender.com` for backend

Just create the `.env` files with localhost URLs and you're good to go! 🚀

