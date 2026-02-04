-- PART 1: RESET & CLEANUP

-- 1. Truncate Tables (Cascade to remove related data)
TRUNCATE TABLE "stories", "notifications", "likes", "comments", "saved_posts", "reports", "follows" CASCADE;

-- If 'posts' table exists, truncate it too. If 'journeys' is the main post table, truncate it.
-- We'll assume 'posts' is the target for "Instagram Logic".
TRUNCATE TABLE "posts" CASCADE;

-- 2. Reset User Avatars
UPDATE "auth"."users" 
SET "raw_user_meta_data" = jsonb_set("raw_user_meta_data", '{avatar_url}', '"https://nomad-app.b-cdn.net/defaults/avatar_placeholder.png"')
WHERE "raw_user_meta_data" ? 'avatar_url';

-- Also update public profiles if they verify specifically
UPDATE "public"."users"
SET "avatar_url" = 'https://nomad-app.b-cdn.net/defaults/avatar_placeholder.png';

-- 3. Ensure Tables Exist

-- Comments Table
CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "post_id" UUID REFERENCES "public"."posts"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes Table (Unique constraint to prevent double likes)
CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "post_id" UUID REFERENCES "public"."posts"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("user_id", "post_id")
);

-- Saved Posts
CREATE TABLE IF NOT EXISTS "public"."saved_posts" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "post_id" UUID REFERENCES "public"."posts"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("user_id", "post_id")
);

-- Reports
CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "reporter_id" UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "post_id" UUID REFERENCES "public"."posts"("id") ON DELETE CASCADE,
    "reason" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending', -- pending, resolved, dismissed
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follows
CREATE TABLE IF NOT EXISTS "public"."follows" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "follower_id" UUID REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "following_id" UUID REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("follower_id", "following_id") -- No self-follow check in SQL usually, handled in app, but unique pair required
);

-- Stories (for Part 3 context)
CREATE TABLE IF NOT EXISTS "public"."stories" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "media_url" TEXT NOT NULL,
    "media_type" TEXT CHECK ("media_type" IN ('image', 'video')),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "expires_at" TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- PART 3: SCHEDULE STORY CLEANUP (Run every hour)
-- Enable the extension if not exists
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Verify net extension matches schema, usually requires no config if on Supabase Platform
-- Schedule the Edge Function (Replace URL and Key with actual values)
-- SELECT cron.schedule(
--    'cleanup-stories-job',
--    '0 * * * *', -- Every hour
--    $$
--    SELECT
--      net.http_post(
--          url:='https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/cleanup-stories',
--          headers:='{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb
--      ) as request_id;
--    $$
-- );

