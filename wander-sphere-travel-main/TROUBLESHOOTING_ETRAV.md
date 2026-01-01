# Troubleshooting Guide - Etrav Integration

## Common Issues and Fixes

### Issue 1: Backend Server Not Starting

**Error:** `fetch is not defined` or `ReferenceError: fetch is not defined`

**Fix:** ✅ Already fixed! The backend now uses Node.js built-in `http`/`https` modules instead of `fetch()`.

**If you still see this error:**
- Make sure you've pulled the latest changes
- Restart your backend server: `npm run dev` or `npm start`

---

### Issue 2: Frontend Build Errors

**Error:** `Cannot find module '@/components/ui/badge'` or similar

**Fix:** 
1. Make sure all UI components exist:
   ```bash
   # Check if these files exist:
   src/components/ui/badge.tsx
   src/components/ui/label.tsx
   ```

2. If missing, create them using shadcn/ui:
   ```bash
   npx shadcn-ui@latest add badge
   npx shadcn-ui@latest add label
   ```

---

### Issue 3: Route Not Found (404)

**Error:** `GET /api/etrav/bus/search 404`

**Fix:**
1. Check `backend/server.js` includes:
   ```javascript
   import etravRoutes from './routes/etrav.js';
   app.use('/api/etrav', etravRoutes);
   ```

2. Restart backend server after adding routes

---

### Issue 4: CORS Errors

**Error:** `Access to fetch at 'http://localhost:5000/api/etrav/...' from origin 'http://localhost:8080' has been blocked by CORS policy`

**Fix:**
1. Check `backend/server.js` CORS configuration
2. Make sure frontend URL is in `allowedOrigins`:
   ```javascript
   const allowedOrigins = [
     'http://localhost:8080',
     'http://localhost:3000',
     // ... other origins
   ];
   ```

---

### Issue 5: Environment Variables Not Set

**Error:** `ETRAV_CONSUMER_KEY is not defined` or API returns 401

**Fix:**
1. Create/update `backend/.env`:
   ```env
   ETRAV_API_URL=http://api.etrav.in/
   ETRAV_CONSUMER_KEY=your_key_here
   ETRAV_CONSUMER_SECRET=your_secret_here
   ```

2. Restart backend server

---

### Issue 6: TypeScript Errors

**Error:** `Property 'tripId' does not exist on type 'BusSearchResult'`

**Fix:**
1. The API response structure might be different
2. Update `src/services/etravService.ts` interfaces to match actual Etrav API response
3. Check Postman documentation for exact field names

---

### Issue 7: Razorpay Not Loading

**Error:** `Razorpay is not defined` or payment modal doesn't open

**Fix:**
1. Add Razorpay key to frontend `.env`:
   ```env
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

2. Make sure Razorpay script loads:
   - Check browser console for script loading errors
   - Verify script URL: `https://checkout.razorpay.com/v1/checkout.js`

---

### Issue 8: Database Errors

**Error:** `relation "bookings" does not exist` or `column "pnr" does not exist`

**Fix:**
1. Make sure `bookings` table exists in Supabase
2. Check table schema matches what the code expects
3. Run migrations if needed

---

## Quick Diagnostic Steps

1. **Check Backend Logs:**
   ```bash
   cd backend
   npm run dev
   # Look for errors in console
   ```

2. **Check Frontend Console:**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

3. **Test API Endpoints:**
   ```bash
   # Test bus search (replace with your actual values)
   curl -X POST http://localhost:5000/api/etrav/bus/search \
     -H "Content-Type: application/json" \
     -d '{"from":"Mumbai","to":"Delhi","date":"2024-12-25","adults":1}'
   ```

4. **Verify Environment Variables:**
   ```bash
   # Backend
   cd backend
   cat .env | grep ETRAV
   
   # Frontend
   cd ..
   cat .env | grep RAZORPAY
   ```

---

## Still Not Working?

1. **Check Node.js Version:**
   ```bash
   node --version
   # Should be >= 16.0.0
   ```

2. **Reinstall Dependencies:**
   ```bash
   # Backend
   cd backend
   rm -rf node_modules package-lock.json
   npm install
   
   # Frontend
   cd ..
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Clear Cache:**
   ```bash
   # Frontend build cache
   rm -rf dist .vite
   ```

4. **Check File Permissions:**
   - Make sure all files are readable
   - Check `.env` files are not in `.gitignore` (but don't commit secrets!)

---

## Getting Help

If issues persist:
1. Check browser console for specific error messages
2. Check backend terminal for server errors
3. Verify all environment variables are set
4. Test API endpoints directly with Postman/curl
5. Check Etrav API documentation for correct request format

---

**Last Updated:** After fixing `fetch()` compatibility issue

