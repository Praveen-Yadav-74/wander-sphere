# White Screen Debugging Guide

## 🔍 Quick Checks

### 1. Open Browser Console (F12)
Check for errors:
- **Red errors** = JavaScript errors preventing app from loading
- **Network errors** = API/Supabase connection issues
- **Missing modules** = Import errors

### 2. Check Terminal/Console
Look for:
- **Build errors** in Vite dev server
- **Compilation errors**
- **Missing dependencies**

### 3. Common Causes

#### A. Missing Environment Variables
**Error:** `Missing Supabase environment variables`

**Fix:**
1. Create `.env` file in root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   VITE_API_BASE_URL=http://localhost:5000
   ```
2. Restart dev server: `npm run dev`

#### B. JavaScript Error
**Error:** Any red error in console

**Fix:**
- Check the error message
- Look for missing imports
- Check for syntax errors

#### C. Network Error
**Error:** `Failed to fetch` or CORS errors

**Fix:**
1. Make sure backend is running: `cd backend && npm run dev`
2. Check backend is on port 5000
3. Check CORS configuration

---

## 🛠️ Step-by-Step Debugging

### Step 1: Check Browser Console
1. Open `localhost:8080`
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Look for **red errors**

**Common Errors:**
- `Missing Supabase environment variables` → Create `.env` file
- `Failed to fetch` → Backend not running
- `Cannot find module` → Missing dependency
- `Unexpected token` → Syntax error

### Step 2: Check Network Tab
1. In DevTools, go to **Network** tab
2. Refresh page (F5)
3. Look for **failed requests** (red)

**What to check:**
- Is `main.tsx` loading? (should be 200)
- Are CSS files loading?
- Are Supabase requests failing?

### Step 3: Check Terminal
1. Look at the terminal where `npm run dev` is running
2. Check for **error messages**
3. Check for **compilation warnings**

### Step 4: Verify Files
1. Check `index.html` has `<div id="root"></div>`
2. Check `src/main.tsx` exists
3. Check `src/App.tsx` exists

---

## 🔧 Quick Fixes

### Fix 1: Clear Cache and Restart
```bash
# Stop dev server (Ctrl+C)
# Clear node_modules cache
rm -rf node_modules/.vite
# Restart
npm run dev
```

### Fix 2: Check Environment Variables
```bash
# In browser console, check:
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)

# If undefined, create .env file
```

### Fix 3: Check Backend
```bash
# Make sure backend is running
cd backend
npm run dev

# Should see: "Server running on port 5000"
```

### Fix 4: Reinstall Dependencies
```bash
# If nothing works, reinstall:
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📋 Checklist

- [ ] Browser console shows no errors
- [ ] `.env` file exists with Supabase credentials
- [ ] Backend server is running on port 5000
- [ ] Frontend dev server is running on port 8080
- [ ] Network tab shows successful requests
- [ ] Terminal shows no compilation errors

---

## 🆘 Still Not Working?

1. **Share the console error** - Copy the exact error message
2. **Check terminal output** - Share any error messages
3. **Check network tab** - See which requests are failing

The most common issue is **missing Supabase environment variables**. Make sure your `.env` file is in the root directory and has the correct values!

