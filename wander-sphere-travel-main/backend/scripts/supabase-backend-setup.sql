-- =============================================
-- SUPABASE BACKEND SETUP
-- Run this in Supabase SQL Editor
-- =============================================
-- This script sets up:
-- 1. Row Level Security (RLS) on all tables
-- 2. Auth trigger to automatically create users in public.users
-- 3. RLS policies for secure data access
-- =============================================

-- =============================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trip_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trip_likes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 2: AUTOMATICALLY CREATE USER IN PUBLIC.USERS ON SIGNUP
-- =============================================
-- This ensures when Auth creates a user, your 'users' table gets the ID and Email.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Initialize notification settings
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STEP 3: RLS POLICIES (Security)
-- =============================================

-- Users Table: Users can see everyone (for social features) but only edit themselves
DROP POLICY IF EXISTS "Users can view public profiles" ON public.users;
CREATE POLICY "Users can view public profiles" 
  ON public.users 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" 
  ON public.users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Trips Table: Users can only see/edit their own trips, or public trips
DROP POLICY IF EXISTS "Users manage own trips" ON public.trips;
CREATE POLICY "Users manage own trips" 
  ON public.trips
  FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view public trips" ON public.trips;
CREATE POLICY "Public can view public trips" 
  ON public.trips
  FOR SELECT
  USING (visibility = 'public' OR auth.uid() = user_id);

-- Journeys Table: Users manage own, but public can view if is_public is true
DROP POLICY IF EXISTS "Users manage own journeys" ON public.journeys;
CREATE POLICY "Users manage own journeys" 
  ON public.journeys
  FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view public journeys" ON public.journeys;
CREATE POLICY "Public can view public journeys" 
  ON public.journeys
  FOR SELECT 
  USING (is_public = true OR auth.uid() = user_id);

-- Stories Table: Users manage own
DROP POLICY IF EXISTS "Users manage own stories" ON public.stories;
CREATE POLICY "Users manage own stories" 
  ON public.stories
  FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view public stories" ON public.stories;
CREATE POLICY "Public can view public stories" 
  ON public.stories
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Notification Settings: Users manage own
DROP POLICY IF EXISTS "Users manage own notification settings" ON public.notification_settings;
CREATE POLICY "Users manage own notification settings" 
  ON public.notification_settings
  FOR ALL
  USING (auth.uid() = user_id);

-- Budgets: Users manage own
DROP POLICY IF EXISTS "Users manage own budgets" ON public.budgets;
CREATE POLICY "Users manage own budgets" 
  ON public.budgets
  FOR ALL
  USING (auth.uid() = user_id);

-- Notifications: Users can only see their own
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" 
  ON public.notifications
  FOR ALL
  USING (auth.uid() = user_id);

-- Trip Participants: Users can see participants of trips they're part of
DROP POLICY IF EXISTS "Users can view trip participants" ON public.trip_participants;
CREATE POLICY "Users can view trip participants" 
  ON public.trip_participants
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_participants.trip_id 
      AND (trips.user_id = auth.uid() OR trips.visibility = 'public')
    )
  );

DROP POLICY IF EXISTS "Users can manage own participation" ON public.trip_participants;
CREATE POLICY "Users can manage own participation" 
  ON public.trip_participants
  FOR ALL
  USING (auth.uid() = user_id);

-- Trip Comments: Public can view, users can manage own
DROP POLICY IF EXISTS "Public can view trip comments" ON public.trip_comments;
CREATE POLICY "Public can view trip comments" 
  ON public.trip_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_comments.trip_id 
      AND (trips.visibility = 'public' OR trips.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage own comments" ON public.trip_comments;
CREATE POLICY "Users can manage own comments" 
  ON public.trip_comments
  FOR ALL
  USING (auth.uid() = user_id);

-- Trip Likes: Similar to comments
DROP POLICY IF EXISTS "Public can view trip likes" ON public.trip_likes;
CREATE POLICY "Public can view trip likes" 
  ON public.trip_likes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_likes.trip_id 
      AND (trips.visibility = 'public' OR trips.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage own likes" ON public.trip_likes;
CREATE POLICY "Users can manage own likes" 
  ON public.trip_likes
  FOR ALL
  USING (auth.uid() = user_id);

-- =============================================
-- SETUP COMPLETE
-- =============================================
-- All RLS policies are now in place
-- Auth trigger will automatically create users in public.users
-- Ready for frontend integration

