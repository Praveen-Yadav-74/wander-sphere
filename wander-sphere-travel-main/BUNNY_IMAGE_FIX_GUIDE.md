# 🔧 Bunny.net Image Loading Fix Guide

## 🎯 Problem Description

Images are uploading to Bunny.net but not loading in the app. This usually happens because the **private Storage URL** is being saved instead of the **public Pull Zone URL**.

---

## 📋 Quick Diagnostic Checklist

### Option A: Visual Browser Inspection (Fastest)

1. **Open your app** in Chrome/Edge
2. **Right-click on a broken image** → Select **"Inspect"** or **"Open Image in New Tab"**
3. **Look at the `src` URL**:

| URL Type | Status | Example |
|----------|--------|---------|
| ✅ **CORRECT** | Public CDN URL | `https://nomad-app-media.b-cdn.net/posts/images/123.jpg` |
| ❌ **WRONG** | Storage URL (Private) | `https://sg.storage.bunnycdn.com/nomad-app-media/posts/images/123.jpg` |
| ❌ **WRONG** | Undefined | `undefined/posts/images/123.jpg` |
| ❌ **WRONG** | Localhost | `http://localhost:5000/posts/images/123.jpg` |

---

### Option B: Browser Console Check

1. **Open your app** in the browser
2. **Press F12** → Go to **Console** tab
3. **Run this command**:

```javascript
console.log({
  PULL_ZONE: import.meta.env.VITE_BUNNY_PULL_ZONE_URL,
  HOSTNAME: import.meta.env.VITE_BUNNY_HOSTNAME,
  STORAGE: import.meta.env.VITE_BUNNY_STORAGE_NAME
});
```

**Expected Output:**
```javascript
{
  PULL_ZONE: "https://nomad-app-media.b-cdn.net",
  HOSTNAME: "sg.storage.bunnycdn.com",
  STORAGE: "nomad-app-media"
}
```

**If any value is `undefined`**, your environment variables are not loading correctly.

---

### Option C: Automated Console Diagnostic

1. **Open** [`check-bunny-config.js`](./check-bunny-config.js)
2. **Copy the entire file content**
3. **Paste it in your browser console** (F12 → Console)
4. **Press Enter**
5. **Follow the on-screen diagnostic results**

This will automatically:
- ✅ Check all environment variables
- 🔍 Scan the page for broken images
- 🧪 Provide helper functions to test URLs
- 📋 Show exactly what's wrong and how to fix it

---

### Option D: Database Check (Supabase)

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy query 1 from** [`diagnose-bunny-database.sql`](./diagnose-bunny-database.sql):

```sql
SELECT 
    id,
    created_at,
    images,
    CASE 
        WHEN images::text LIKE '%storage.bunnycdn.com%' THEN '❌ WRONG: Using Storage URL'
        WHEN images::text LIKE '%b-cdn.net%' THEN '✅ CORRECT: Using CDN URL'
        WHEN images::text LIKE '%undefined%' THEN '❌ WRONG: Undefined in URL'
        ELSE '⚠️ UNKNOWN'
    END as url_status
FROM posts
ORDER BY created_at DESC
LIMIT 10;
```

3. **Run it** and check the `url_status` column
4. If you see **"❌ WRONG"**, continue to the fix section below

---

### Option E: Interactive HTML Diagnostic Tool

1. **Open** [`diagnose-bunny-urls.html`](./diagnose-bunny-urls.html) **in your browser**
2. **Follow the step-by-step diagnostic wizard**
3. **Get instant visual feedback** on what's wrong and how to fix it

---

## 🔧 Common Fixes

### Fix 1: Environment Variables Not Loading

**Symptoms:**
- Images show `undefined` in URL
- Console shows `VITE_BUNNY_PULL_ZONE_URL: undefined`

**Solution:**

1. **Open** `.env` file in project root
2. **Verify these lines exist**:

```env
VITE_BUNNY_PULL_ZONE_URL=https://nomad-app-media.b-cdn.net
VITE_BUNNY_HOSTNAME=sg.storage.bunnycdn.com
VITE_BUNNY_STORAGE_NAME=nomad-app-media
VITE_BUNNY_API_KEY=a9ce5ca7-27cd-4358-8b8075ed96eb-a794-4d87
VITE_BUNNY_REGION=sg
```

3. **Restart your dev server**:
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

4. **Clear browser cache** (Ctrl+Shift+Delete)
5. **Reload the page**

---

### Fix 2: Code Returning Storage URL Instead of CDN URL

**Symptoms:**
- Images show `storage.bunnycdn.com` in URL
- Database has `storage.bunnycdn.com` URLs

**Solution:**

Your `bunnyUpload.ts` is already correct! The issue is likely:

1. **Old data in database** - Run the SQL fix in [`diagnose-bunny-database.sql`](./diagnose-bunny-database.sql) (queries 7-8)
2. **Or browser cached the old broken URLs** - Clear cache completely

**To fix existing data in database:**

```sql
-- Run this in Supabase SQL Editor
UPDATE posts
SET images = REPLACE(
    images::text, 
    'https://sg.storage.bunnycdn.com/nomad-app-media/', 
    'https://nomad-app-media.b-cdn.net/'
)::jsonb
WHERE images::text LIKE '%storage.bunnycdn.com%';

UPDATE stories
SET media_url = REPLACE(
    media_url, 
    'https://sg.storage.bunnycdn.com/nomad-app-media/', 
    'https://nomad-app-media.b-cdn.net/'
)
WHERE media_url LIKE '%storage.bunnycdn.com%';
```

---

### Fix 3: Pull Zone Not Connected to Storage Zone

**Symptoms:**
- URL format is correct (`b-cdn.net`)
- But images still don't load (404 error)

**Solution:**

1. **Log in to** [Bunny.net Dashboard](https://panel.bunny.net)
2. **Go to Pull Zones** → Click **"nomad-app-media"**
3. **Check "Origin URL"**:
   - Should be: `https://sg.storage.bunnycdn.com/nomad-app-media/`
   - If empty, click **"Connect to Storage Zone"** and select `nomad-app-media`
4. **Save changes**
5. **Wait 1-2 minutes** for CDN propagation
6. **Test again**

---

### Fix 4: File Doesn't Exist in Storage

**Symptoms:**
- URL is correct
- Pull Zone is connected
- Still getting 404

**Solution:**

1. **Go to Bunny.net** → **Storage** → **nomad-app-media**
2. **Browse folders** (stories, posts/images, posts/videos)
3. **Verify the file exists** with the exact name in the URL
4. If missing, **re-upload** from your app

---

## 🧪 Testing Your Fix

### Test New Upload:

1. **Create a new post/story** with an image
2. **Right-click the image** → Inspect
3. **Verify URL starts with**: `https://nomad-app-media.b-cdn.net/`

### Test Console Helper:

```javascript
// Run in browser console
testBunnyImage("posts/images/1234567_abc.jpg");
```

This will:
- Load the image
- Show if it succeeded or failed
- Give you the exact error if it fails

---

## 📊 Your Current Configuration

Based on your `.env` file:

```env
✅ VITE_BUNNY_PULL_ZONE_URL=https://nomad-app-media.b-cdn.net
✅ VITE_BUNNY_HOSTNAME=sg.storage.bunnycdn.com
✅ VITE_BUNNY_STORAGE_NAME=nomad-app-media
✅ VITE_BUNNY_REGION=sg
✅ VITE_BUNNY_API_KEY=[SET]
```

**Configuration is correct!** ✅

---

## 🔍 Advanced Debugging

### Check Upload Flow:

Add console logs to see what URL is being generated:

```javascript
// In src/services/bunnyUpload.ts (already has logs)
// Check browser console when uploading

// You should see:
// ✅ Image uploaded to Bunny.net: https://nomad-app-media.b-cdn.net/posts/images/...
```

### Check Network Tab:

1. **Open DevTools** (F12) → **Network** tab
2. **Filter by**: `Img`
3. **Upload a new image**
4. **Look at the image requests**:
   - Status should be `200`
   - URL should be `b-cdn.net`
   - If `404`: File doesn't exist
   - If CORS error: Pull Zone not configured

---

## 📝 Summary: What Should Happen

### Correct Upload Flow:

1. User selects image → ✅
2. `uploadToBunny()` compresses (if image) → ✅
3. Uploads to `https://sg.storage.bunnycdn.com/nomad-app-media/[folder]/[file]` → ✅
4. **Returns PUBLIC URL**: `https://nomad-app-media.b-cdn.net/[folder]/[file]` → ✅
5. Frontend saves this public URL to database → ✅
6. Image renders using public CDN URL → ✅

---

## 🆘 Still Not Working?

If you've tried everything above and images still don't load:

1. **Run the automated diagnostic**:
   ```bash
   # Open diagnose-bunny-urls.html in browser
   # OR paste check-bunny-config.js in console
   ```

2. **Check these files have correct logic**:
   - [`src/services/bunnyUpload.ts`](./src/services/bunnyUpload.ts) (line 230)
   - [`src/components/CreatePost.tsx`](./src/components/CreatePost.tsx) (uploadResult.publicUrl)
   - [`src/components/CreateStory.tsx`](./src/components/CreateStory.tsx) (uploadResult.publicUrl)

3. **Paste the actual broken URL here** and compare with expected format

4. **Check Bunny.net dashboard**:
   - Storage → nomad-app-media → Verify files exist
   - Pull Zones → nomad-app-media → Verify connected to storage

---

## ✅ Verification Checklist

- [ ] Environment variables are set in `.env`
- [ ] Dev server restarted after changing `.env`
- [ ] Browser cache cleared
- [ ] Console shows correct Pull Zone URL when checked
- [ ] Pull Zone is connected to Storage Zone in Bunny.net
- [ ] New uploads show `b-cdn.net` URL in database
- [ ] Test image loads in browser
- [ ] No CORS errors in console

---

**Good luck! 🚀 Your configuration looks correct, so it's likely either a browser cache issue or old data in the database.**
