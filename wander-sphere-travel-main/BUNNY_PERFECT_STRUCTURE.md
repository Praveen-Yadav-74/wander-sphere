# Bunny.net Perfect Structure Implementation Guide

## 🎯 Overview

This implementation provides a complete refactored backend for your Travel App, switching from Supabase Storage to Bunny.net CDN while maintaining Supabase for the database.

### ✅ What's Included

1. **Organized Folder Structure** in Bunny.net
2. **Upload Service** with dual return values (public URL + storage path)
3. **Database Integration** with automatic expiration
4. **Automated Cleanup** via Supabase Edge Function + pg_cron

---

## 📁 1. Folder Organization (Bunny.net)

All media is organized into logical folders:

```
nomad-app-media/          (Bunny.net Storage Zone)
├── stories/              (24-hour expiring stories)
│   └── 1736450123_abc.jpg
├── posts/
│   ├── images/           (Post images)
│   │   └── 1736450456_def.jpg
│   └── videos/           (Post videos)
│       └── 1736450789_ghi.mp4
```

### Media Types

| Type | Folder Path | Description |
|------|-------------|-------------|
| `story` | `stories/{filename}` | 24-hour expiring stories |
| `post_image` | `posts/images/{filename}` | Permanent post images |
| `post_video` | `posts/videos/{filename}` | Permanent post videos |

---

## 🔧 2. Upload Service

### Location
`src/services/bunnyUpload.ts`

### Core Function

```typescript
import { uploadToBunny } from '@/services/bunnyUpload';

const result = await uploadToBunny(file, 'story', {
  compress: true,
  quality: 0.8,
  onProgress: (progress) => console.log(`${progress}%`)
});

if (result.success) {
  console.log('Public URL:', result.publicUrl);
  console.log('Storage Path:', result.storagePath);
}
```

### Return Values

```typescript
interface BunnyUploadResult {
  success: boolean;
  publicUrl?: string;      // For display: https://nomad-app-media.b-cdn.net/stories/12345.jpg
  storagePath?: string;    // For deletion: stories/12345.jpg
  error?: string;
}
```

### Supported Functions

```typescript
// Upload with type-based folder routing
uploadToBunny(file: File, type: MediaType, options?: UploadOptions)

// Delete from storage
deleteFromBunny(storagePath: string)

// Validate before upload
validateFile(file: File, type: MediaType)

// Auto-detect media type
getMediaTypeFromFile(file: File)
```

---

## 💾 3. Database Integration

### Stories Table (with expiration)

```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT,
  content TEXT,
  media_url TEXT NOT NULL,          -- Public CDN URL
  storage_path TEXT NOT NULL,        -- For deletion (e.g., "stories/12345.jpg")
  media_type TEXT DEFAULT 'image',
  caption TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  is_public BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stories_expires_at ON stories(expires_at);
```

### Posts Table

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,                    -- Public CDN URL
  tags TEXT[],
  is_public BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'published',
  trip_id UUID REFERENCES trips(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔄 4. Automated Cleanup System

### Architecture

```
┌─────────────┐     Every Hour      ┌──────────────┐
│   pg_cron   │ ──────────────────> │ Edge Function│
│  Scheduler  │                     │  (Supabase)  │
└─────────────┘                     └──────┬───────┘
                                           │
                                           │ 1. Query Expired
                                           ▼
                                    ┌──────────────┐
                                    │   Supabase   │
                                    │   Database   │
                                    └──────┬───────┘
                                           │
                      ┌────────────────────┴─────────────────┐
                      │ 2. Delete Media    │ 3. Delete Row   │
                      ▼                    ▼                 │
               ┌──────────────┐     ┌──────────────┐        │
               │  Bunny.net   │     │   Database   │        │
               │   Storage    │     │     Row      │        │
               └──────────────┘     └──────────────┘        │
```

### Edge Function

**Location:** `supabase/functions/delete-expired-stories/index.ts`

**Environment Variables Required:**
```bash
BUNNY_STORAGE_NAME=nomad-app-media
BUNNY_ACCESS_KEY=your-access-key
BUNNY_HOSTNAME=sg.storage.bunnycdn.com
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Cleanup Logic

1. **Query** expired stories: `WHERE expires_at < NOW()`
2. **Loop** through results
3. **Delete** from Bunny.net using `storage_path`
4. **Delete** from database if successful

---

## 🚀 5. Setup Instructions

### Step 1: Configure Environment

Update your `.env` file:

```env
# Bunny.net Configuration
VITE_BUNNY_STORAGE_NAME=nomad-app-media
VITE_BUNNY_HOSTNAME=sg.storage.bunnycdn.com
VITE_BUNNY_API_KEY=a9ce5ca7-27cd-4358-8b8075ed96eb-a794-4d87
VITE_BUNNY_PULL_ZONE_URL=https://nomad-app-media.b-cdn.net
VITE_BUNNY_REGION=sg
```

### Step 2: Run Database Migration

```bash
# Apply the SQL setup
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/bunny_net_setup.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Paste contents of `bunny_net_setup.sql`
3. **Replace** `YOUR_PROJECT_REF` with your actual project ref
4. Run the script

### Step 3: Enable pg_cron Extension

In Supabase Dashboard:
1. Navigate to **Database** > **Extensions**
2. Search for `pg_cron`
3. Click **Enable**

### Step 4: Deploy Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the edge function
supabase functions deploy delete-expired-stories

# Set environment secrets
supabase secrets set BUNNY_STORAGE_NAME=nomad-app-media
supabase secrets set BUNNY_ACCESS_KEY=a9ce5ca7-27cd-4358-8b8075ed96eb-a794-4d87
supabase secrets set BUNNY_HOSTNAME=sg.storage.bunnycdn.com
```

### Step 5: Schedule the Cleanup Job

The SQL migration already includes the cron job setup. Verify it's running:

```sql
-- View scheduled job
SELECT * FROM cron.job WHERE jobname = 'delete-expired-stories-hourly';

-- View execution history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'delete-expired-stories-hourly')
ORDER BY start_time DESC 
LIMIT 10;
```

---

## 📝 6. Usage Examples

### Example 1: Create a Story

```typescript
import { CreateStory } from '@/components/CreateStory';

function MyPage() {
  return (
    <CreateStory
      onSuccess={(storyId) => {
        console.log('Story created:', storyId);
        // Navigate or refresh
      }}
    />
  );
}
```

**What Happens:**
1. User selects image → compressed
2. Uploaded to `stories/` folder in Bunny.net
3. Inserted into database with:
   - `media_url`: Public CDN URL
   - `storage_path`: For deletion
   - `expires_at`: NOW() + 24 hours
4. After 24 hours, cron job automatically deletes from both Bunny.net and database

### Example 2: Create a Post

```typescript
import { CreatePost } from '@/components/CreatePost';

function MyPage() {
  return (
    <CreatePost
      tripId="optional-trip-id"
      onSuccess={(postId) => {
        console.log('Post created:', postId);
      }}
    />
  );
}
```

**What Happens:**
1. User selects image → compressed
2. Uploaded to `posts/images/` folder in Bunny.net
3. Inserted into `posts` table with `media_url`
4. Post remains permanent (no expiration)

### Example 3: Manual Upload (Advanced)

```typescript
import { uploadToBunny } from '@/services/bunnyUpload';
import { supabase } from '@/config/supabase';

async function uploadStoryManually(imageFile: File, caption: string) {
  // 1. Upload to Bunny.net
  const upload = await uploadToBunny(imageFile, 'story', {
    compress: true,
    quality: 0.8,
  });

  if (!upload.success) {
    throw new Error(upload.error);
  }

  // 2. Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // 3. Calculate expiration (24 hours)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // 4. Insert into database
  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: user!.id,
      media_url: upload.publicUrl,
      storage_path: upload.storagePath,  // CRITICAL for cleanup
      caption: caption,
      expires_at: expiresAt,
    })
    .select()
    .single();

  return data;
}
```

---

## 🔍 7. Monitoring & Testing

### Check Expired Stories

```sql
-- View stories waiting to be cleaned up
SELECT * FROM get_expired_stories();

-- View stories expiring soon
SELECT * FROM get_expiring_stories(6);  -- Next 6 hours
```

### Manually Trigger Cleanup

```sql
-- Run cleanup immediately (for testing)
SELECT trigger_story_cleanup();
```

### Check Cron Job Status

```sql
-- View job configuration
SELECT * FROM cron.job WHERE jobname = 'delete-expired-stories-hourly';

-- View recent executions
SELECT 
  runid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'delete-expired-stories-hourly')
ORDER BY start_time DESC
LIMIT 10;
```

### Test Edge Function Directly

```bash
# Using curl
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/delete-expired-stories \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

---

## 🛠️ 8. Troubleshooting

### Issue: Stories not being deleted

**Check:**
1. Is pg_cron enabled? `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
2. Is the cron job scheduled? `SELECT * FROM cron.job;`
3. Check execution logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`
4. Verify Edge Function secrets are set: `supabase secrets list`

### Issue: Upload fails with 401

**Solution:**
- Verify `VITE_BUNNY_API_KEY` in `.env` matches your Bunny.net access key
- Check Bunny.net dashboard for correct password

### Issue: Files not showing (404)

**Solution:**
- Verify Pull Zone URL is correct
- Check if files exist in Bunny.net dashboard
- Ensure Pull Zone is linked to your Storage Zone

---

## 📊 9. File Structure Summary

```
src/
├── services/
│   └── bunnyUpload.ts          # Core upload service ⭐
├── components/
│   ├── CreateStory.tsx         # Story creation with expiration ⭐
│   └── CreatePost.tsx          # Post creation (permanent) ⭐
└── types/
    └── media.ts                # TypeScript types (from previous implementation)

supabase/
├── functions/
│   └── delete-expired-stories/
│       ├── index.ts            # Edge Function for cleanup ⭐
│       └── deno.json           # Deno configuration
└── migrations/
    └── bunny_net_setup.sql     # Database setup & cron job ⭐
```

---

## ✅ 10. Verification Checklist

Before going live:

- [ ] Environment variables configured in `.env`
- [ ] Database migration executed successfully
- [ ] `storage_path` column exists in `stories` table
- [ ] pg_cron extension enabled
- [ ] Edge Function deployed
- [ ] Edge Function secrets configured
- [ ] Cron job scheduled (runs every hour)
- [ ] Test story creation works
- [ ] Test post creation works
- [ ] Manually trigger cleanup and verify it works
- [ ] Check Bunny.net dashboard shows uploaded files
- [ ] Verify files are accessible via CDN URLs

---

## 🎉 Summary

You now have a **production-ready** Bunny.net integration with:

✅ **Perfect folder structure** (stories/, posts/images/, posts/videos/)  
✅ **Dual return values** (publicUrl + storagePath)  
✅ **Automatic expiration** (24 hours for stories)  
✅ **Automated cleanup** (Edge Function + pg_cron)  
✅ **Type-safe** implementation  
✅ **React components** ready to use  

**Start creating stories and posts now!** 🚀
