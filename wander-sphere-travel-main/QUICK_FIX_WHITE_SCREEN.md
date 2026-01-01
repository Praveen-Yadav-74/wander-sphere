# 🚨 Quick Fix for White Screen

## Most Common Cause: Missing Environment Variables

The white screen is **99% likely** caused by missing Supabase credentials.

---

## ✅ Quick Fix (2 minutes)

### Step 1: Create `.env` File

Create a file named `.env` in the **root directory** (same folder as `package.json`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_BASE_URL=http://localhost:5000
```

### Step 2: Get Your Supabase Credentials

1. Go to: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### Step 3: Restart Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🔍 How to Verify

### Check Browser Console (F12)

**If you see:**
- `Missing Supabase environment variables` → You need to create `.env` file
- `Failed to fetch` → Backend not running
- Any red errors → Check the error message

### Check Terminal

**If you see:**
- `VITE v7.x.x  ready in xxx ms` → Server is running
- Any errors → Share the error message

---

## 📋 Checklist

- [ ] `.env` file exists in root directory
- [ ] `.env` has `VITE_SUPABASE_URL` (not empty)
- [ ] `.env` has `VITE_SUPABASE_ANON_KEY` (not empty)
- [ ] Dev server restarted after creating `.env`
- [ ] Browser console shows no red errors

---

## 🆘 Still White Screen?

1. **Open Browser Console (F12)**
2. **Copy the exact error message**
3. **Check terminal for errors**
4. **Share both with me**

The app now shows a helpful error message if Supabase credentials are missing, so you should see instructions instead of a blank screen!

