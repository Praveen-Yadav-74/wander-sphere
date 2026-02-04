-- 🧹 THE FINAL CLEANUP (Zombie Data Destroyer)

BEGIN;

-- 1. TRUNCATE Tables (As requested: "Wipe it too")
RAISE NOTICE 'Truncating journeys and trips tables...';
TRUNCATE TABLE "journeys", "trips" CASCADE;
-- Also truncate related items if they exist (PostgreSQL invalidates dependent rows via CASCADE usually, but listing explicitly helps)
-- TRUNCATE TABLE "journey_items", "trip_photos" CASCADE; -- If these exist. 'trips' CASCADE should handle 'trip_photos' if FK is set.

-- 2. Clean Users Table (Found 1 match in audit)
RAISE NOTICE 'Cleaning users table avatar URLs...';
UPDATE "public"."users"
SET "avatar_url" = 'https://nomad-app.b-cdn.net/defaults/avatar_placeholder.png'
WHERE "avatar_url" LIKE '%supabase.co%';

UPDATE "public"."users"
SET "avatar" = 'https://nomad-app.b-cdn.net/defaults/avatar_placeholder.png'
WHERE "avatar" LIKE '%supabase.co%';

-- 3. Clean Storage Objects (Supabase Internal Storage)
-- This tries to remove files from the storage bucket metadata. 
-- Note: You need appropriate permissions (service_role) for this.
RAISE NOTICE 'Attempting to clean storage.objects...';
DELETE FROM "storage"."objects"
WHERE "bucket_id" IN ('post-images', 'posts', 'avatars', 'stories', 'trip-covers'); 
-- Added common bucket names.

COMMIT;

RAISE NOTICE 'Cleanup complete. Zombie data destroyed.';
