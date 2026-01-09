# 🚀 Bunny.net Quick Reference Card

## 📦 Import

```typescript
import { uploadToBunny, deleteFromBunny, validateFile } from '@/services/bunnyUpload';
import { supabase } from '@/config/supabase';
```

---

## 🎯 Upload Story (24h expiration)

```typescript
// Upload to stories/ folder
const result = await uploadToBunny(file, 'story', {
  compress: true,
  quality: 0.8,
  onProgress: (p) => console.log(`${p}%`)
});

// Save to database with expiration
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

await supabase.from('stories').insert({
  user_id: userId,
  media_url: result.publicUrl,      // ✅ For display
  storage_path: result.storagePath,  // ✅ For deletion
  expires_at: expiresAt,             // ✅ Auto-cleanup
});
```

---

## 📸 Upload Post Image (Permanent)

```typescript
// Upload to posts/images/ folder
const result = await uploadToBunny(file, 'post_image', {
  compress: true,
  quality: 0.85,
});

// Save to posts table
await supabase.from('posts').insert({
  user_id: userId,
  title: 'My Post',
  content: 'Content here...',
  media_url: result.publicUrl,
});
```

---

## 🎥 Upload Post Video

```typescript
// Upload to posts/videos/ folder (no compression)
const result = await uploadToBunny(videoFile, 'post_video', {
  compress: false,
  onProgress: (p) => console.log(`${p}%`)
});

await supabase.from('posts').insert({
  user_id: userId,
  media_url: result.publicUrl,
});
```

---

## 🗑️ Delete File

```typescript
// Delete from Bunny.net storage
const success = await deleteFromBunny(storagePath);

// Then delete from database
await supabase.from('stories').delete().eq('id', storyId);
```

---

## ✅ Validate Before Upload

```typescript
const validation = validateFile(file, 'story');
if (!validation.valid) {
  alert(validation.error);
  return;
}
```

---

## 🔄 Folder Structure

| Type | Folder | Example Path |
|------|--------|-------------|
| Story | `stories/` | `stories/1736450123_abc.jpg` |
| Post Image | `posts/images/` | `posts/images/1736450456_def.jpg` |
| Post Video | `posts/videos/` | `posts/videos/1736450789_ghi.mp4` |

---

## 📊 Return Values

```typescript
interface BunnyUploadResult {
  success: boolean;
  publicUrl?: string;      // https://nomad-app-media.b-cdn.net/stories/123.jpg
  storagePath?: string;    // stories/123.jpg (for deletion)
  error?: string;
}
```

---

## ⚙️ Options

```typescript
interface UploadOptions {
  compress?: boolean;        // Default: true for images
  quality?: number;          // Default: 0.8 (80%)
  maxWidth?: number;         // Default: 1920px
  onProgress?: (progress: number) => void;
}
```

---

## 🧩 React Components

```typescript
// Story Component (24h expiration)
import { CreateStory } from '@/components/CreateStory';
<CreateStory onSuccess={(id) => console.log(id)} />

// Post Component (permanent)
import { CreatePost } from '@/components/CreatePost';
<CreatePost onSuccess={(id) => console.log(id)} />
```

---

## 🔧 Edge Function (Auto-Cleanup)

**Deploy:**
```bash
supabase functions deploy delete-expired-stories
supabase secrets set BUNNY_STORAGE_NAME=nomad-app-media
supabase secrets set BUNNY_ACCESS_KEY=your-key
supabase secrets set BUNNY_HOSTNAME=sg.storage.bunnycdn.com
```

**Manual Trigger:**
```sql
SELECT trigger_story_cleanup();
```

---

## 📅 Schedule (pg_cron)

```sql
-- Runs every hour at minute 0
SELECT * FROM cron.job WHERE jobname = 'delete-expired-stories-hourly';
```

---

## 🔍 Monitoring

```sql
-- View expired stories
SELECT * FROM get_expired_stories();

-- View stories expiring soon
SELECT * FROM get_expiring_stories(6);  -- Next 6 hours

-- Check cron history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## 🛠️ Setup Checklist

- [ ] `.env` configured with Bunny.net credentials
- [ ] Database migration executed (`bunny_net_setup.sql`)
- [ ] pg_cron extension enabled
- [ ] Edge Function deployed
- [ ] Secrets configured
- [ ] Cron job scheduled
- [ ] Test upload works
- [ ] Test cleanup works

---

## 📚 Full Documentation

- **Implementation Guide:** `BUNNY_PERFECT_STRUCTURE.md`
- **Usage Examples:** `src/services/bunnyUploadExamples.ts`
- **SQL Setup:** `supabase/migrations/bunny_net_setup.sql`
- **Edge Function:** `supabase/functions/delete-expired-stories/index.ts`

---

## 💡 Pro Tips

1. **Always save `storage_path`** in database for cleanup
2. **Compress images** to save bandwidth (70-80% reduction)
3. **Don't compress videos** (set `compress: false`)
4. **Check validation** before uploading
5. **Monitor cron jobs** regularly for failures
6. **Test cleanup** before production deployment

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Error | Check `VITE_BUNNY_API_KEY` |
| 404 on CDN | Verify Pull Zone URL |
| Stories not deleting | Check pg_cron & Edge Function |
| Upload timeout | Reduce image size or check internet |

---

**Need Help?** See `BUNNY_PERFECT_STRUCTURE.md` for detailed documentation.
