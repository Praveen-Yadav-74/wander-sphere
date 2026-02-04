-- =====================================================
-- CRITICAL DATABASE MIGRATION SCRIPT
-- =====================================================
-- WARNING: This script will DELETE ALL DATA from:
--   - posts
--   - stories  
--   - journeys
--   - trips
--   - clubs
--   - notifications
--
-- BACKUP YOUR DATABASE BEFORE RUNNING THIS!
-- =====================================================

-- 1. DROP REDUNDANT TABLES (Cleanup)
DROP TABLE IF EXISTS user_relationships CASCADE; -- We use 'follows' instead
DROP TABLE IF EXISTS likes CASCADE; -- We will use 'post_likes' as the main table

-- 2. CREATE MISSING TABLES (Critical Fixes)
CREATE TABLE IF NOT EXISTS public.club_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(club_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  trip_id uuid REFERENCES public.trips(id),
  type text NOT NULL CHECK (type IN ('flight', 'hotel', 'bus', 'train')),
  provider text, -- e.g., 'Indigo', 'Volvo'
  booking_reference text, -- e.g., PNR
  status text DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  amount numeric NOT NULL,
  currency text DEFAULT 'INR',
  ticket_details jsonb, -- Stores Seat No, Room Type, etc.
  created_at timestamp with time zone DEFAULT now()
);

-- 3. STANDARDIZE MEDIA COLUMNS (The "Anti-Zombie" Fix)
-- We rename everything to 'media_urls' so one script can clean them all.

-- Fix Journeys
ALTER TABLE journeys DROP COLUMN IF EXISTS photos CASCADE;
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}';

-- Fix Trips
ALTER TABLE trips DROP COLUMN IF EXISTS images CASCADE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}';

-- Fix Stories (Consolidate)
ALTER TABLE stories DROP COLUMN IF EXISTS images CASCADE;
ALTER TABLE stories DROP COLUMN IF EXISTS featured_image CASCADE;
-- Ensure media_urls exists (it might not)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}';

-- Fix Clubs
ALTER TABLE clubs DROP COLUMN IF EXISTS cover_image CASCADE;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}';

-- 4. FUTURE PROOFING (Linking Posts to Clubs)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;

-- 5. FINAL CLEANUP (Wipe old data to match new structure)
-- WARNING: THIS WILL DELETE ALL YOUR DATA IN THESE TABLES!
TRUNCATE TABLE posts, stories, journeys, trips, clubs, notifications CASCADE;

-- 6. Verify Changes
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('journeys', 'trips', 'stories', 'clubs', 'posts', 'bookings', 'club_members')
ORDER BY table_name, ordinal_position;
