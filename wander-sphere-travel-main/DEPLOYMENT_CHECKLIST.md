# Deployment Checklist for Supabase Storage Migration

## ✅ Completed Steps

- [x] Backend code updated to use Supabase Storage
- [x] Frontend API endpoints updated
- [x] Cloudinary dependencies removed
- [x] Backend server running successfully (localhost:5000)
- [x] Supabase configuration verified

## 🔧 Next Steps to Complete

### 1. Set Up Supabase Storage Bucket and Policies

**Go to your Supabase Dashboard:** https://app.supabase.com/project/gserzaenfrmrqoffzcxr

#### Step 1: Create Storage Bucket
1. Navigate to **Storage** → **Buckets**
2. Click **"New Bucket"**
3. Name: `media`
4. Make it **Public** ✅
5. Click **"Create Bucket"**

#### Step 2: Apply RLS Policies
1. Go to **SQL Editor**
2. Copy and paste these SQL commands:

```sql
-- Allow authenticated users to upload files 
CREATE POLICY "Allow authenticated uploads" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'media'); 

-- Allow public access to view files 
CREATE POLICY "Allow public access" ON storage.objects 
FOR SELECT TO public 
USING (bucket_id = 'media'); 

-- Allow users to delete their own files 
CREATE POLICY "Allow users to delete own files" ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

3. Click **"Run"** to execute the policies

### 2. Update Production Environment Variables

#### Backend (Render/Railway)
Add these environment variables to your backend deployment:
```
SUPABASE_URL=https://gserzaenfrmrqoffzcxr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZXJ6YWVuZnJtcnFvZmZ6Y3hyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjExNzc5OSwiZXhwIjoyMDcxNjkzNzk5fQ.odO_-TqCDpliDv-TplUokm08gfoZARABo62vCTDRWCw
```

#### Frontend (Vercel)
You need to add the **SUPABASE_ANON_KEY** to Vercel:
1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add:
```
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**To find your ANON KEY:**
1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy the **anon/public** key
3. Add it to Vercel environment variables

### 3. Redeploy Applications

#### Backend
- Trigger a new deployment on Render/Railway
- Verify the health endpoint: `https://your-backend-url/api/media/health`
- Should show: `{"storage":{"configured":true}}`

#### Frontend
- Trigger a new deployment on Vercel
- Test file upload functionality

### 4. Test the Integration

1. **Login to your application**
2. **Try uploading an avatar:**
   - Go to Profile page
   - Upload a new avatar image
   - Check browser console for errors

3. **Try uploading trip images:**
   - Create or edit a trip
   - Upload trip images
   - Verify images display correctly

4. **Check Supabase Storage:**
   - Go to Supabase Dashboard → **Storage** → **media**
   - Verify uploaded files appear in the bucket

## 🐛 Troubleshooting API Integration Errors

### Common Issues:

1. **"Network Error" or "Failed to fetch"**
   - Check if backend is deployed and accessible
   - Verify CORS settings allow your frontend domain
   - Test backend health: `curl https://your-backend-url/api/media/health`

2. **"Storage bucket not found"**
   - Ensure `media` bucket exists in Supabase
   - Verify bucket is set to **Public**

3. **"Permission denied"**
   - Check RLS policies are applied correctly
   - Verify user authentication is working

4. **"Missing environment variables"**
   - Ensure all Supabase env vars are set in production
   - Redeploy after adding missing variables

### Debug Steps:

1. **Check browser console** for specific error messages
2. **Check network tab** to see which API calls are failing
3. **Test backend directly** using curl or Postman
4. **Verify Supabase connection** in the dashboard

## 📋 Final Verification

- [ ] Supabase `media` bucket created and public
- [ ] RLS policies applied successfully
- [ ] Backend deployed with Supabase env vars
- [ ] Frontend deployed with SUPABASE_ANON_KEY
- [ ] File upload works without errors
- [ ] Images display correctly in the app
- [ ] No console errors related to storage

## 🆘 Need Help?

If you encounter issues:
1. Check the browser console for specific error messages
2. Test the backend health endpoint
3. Verify all environment variables are set correctly
4. Check Supabase dashboard for any error logs

The migration from Cloudinary to Supabase Storage is now complete! 🎉