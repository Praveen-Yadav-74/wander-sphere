# Supabase Storage Setup Guide

## 1. Create Storage Bucket

First, you need to create the `media` storage bucket in your Supabase dashboard:

1. Go to your Supabase project dashboard: https://app.supabase.com/project/gserzaenfrmrqoffzcxr
2. Navigate to **Storage** in the left sidebar
3. Click **Create Bucket**
4. Set bucket name as: `media`
5. Make it **Public** (check the public option)
6. Click **Create Bucket**

## 2. Set Up Row Level Security (RLS) Policies

After creating the bucket, you need to apply the storage policies. Go to **SQL Editor** in your Supabase dashboard and run these SQL commands:

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

## 3. Verify Storage Configuration

After setting up the policies, test the storage configuration:

1. Visit your backend health endpoint: http://localhost:5000/api/media/health
2. You should see:
   ```json
   {
     "status": "ok",
     "message": "Media service is running",
     "storage": {
       "provider": "supabase",
       "configured": true
     }
   }
   ```

## 4. Environment Variables Check

Make sure these environment variables are set in your deployment:

### Backend (.env)
```
SUPABASE_URL=https://gserzaenfrmrqoffzcxr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Frontend (Vercel Environment Variables)
```
VITE_SUPABASE_URL=https://gserzaenfrmrqoffzcxr.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://wander-sphere-ue7e.onrender.com/api
```

## 5. Testing File Upload

To test if everything works:

1. Login to your application
2. Try uploading an image (avatar or trip image)
3. Check the browser network tab for any errors
4. Verify files appear in Supabase Storage dashboard

## 6. Common Issues and Solutions

### Issue: "API Integration Error"
**Possible causes:**
- Backend server not running or accessible
- CORS configuration issues
- Missing environment variables
- Supabase policies not set correctly

**Solutions:**
1. Check backend server is running: http://localhost:5000/api/media/health
2. Verify CORS settings in backend/server.js
3. Check browser console for specific error messages
4. Verify all environment variables are set correctly

### Issue: "Storage bucket not found"
**Solution:** Make sure the `media` bucket exists and is public

### Issue: "Permission denied"
**Solution:** Verify RLS policies are applied correctly

## 7. File Structure in Storage

Files will be organized as:
```
media/
├── avatars/
│   └── {userId}/
│       └── {filename}
├── trips/
│   └── {tripId}/
│       └── {filename}
└── temp/
    └── {userId}/
        └── {filename}
```

## 8. Migration Notes

- All Cloudinary references have been removed
- File paths now use Supabase Storage paths instead of Cloudinary IDs
- Response format updated to include `storage_path`, `url`, `size`, etc.
- Automatic cleanup of temporary files older than 24 hours