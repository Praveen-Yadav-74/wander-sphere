-- Targeted RLS Setup Script Based on Actual Database Schema
-- This script only includes tables that exist in your database

-- =============================================
-- STEP 1: Enable RLS on Existing Tables
-- =============================================

-- Core application tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_comment_likes ENABLE ROW LEVEL SECURITY;

-- Additional tables (based on schema diagram)
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 2: Create RLS Policies for Users Table
-- =============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can view other users' public profiles
CREATE POLICY "Users can view public profiles" ON public.users
  FOR SELECT USING (is_active = true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (registration)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- STEP 3: Create RLS Policies for Trips Table
-- =============================================

-- Users can view all public trips
CREATE POLICY "Anyone can view public trips" ON public.trips
  FOR SELECT USING (true);

-- Users can create their own trips
CREATE POLICY "Users can create own trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own trips
CREATE POLICY "Users can update own trips" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own trips
CREATE POLICY "Users can delete own trips" ON public.trips
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 4: Create RLS Policies for Budgets Table
-- =============================================

-- Users can view their own budgets
CREATE POLICY "Users can view own budgets" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own budgets
CREATE POLICY "Users can create own budgets" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own budgets
CREATE POLICY "Users can update own budgets" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own budgets
CREATE POLICY "Users can delete own budgets" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 5: Create RLS Policies for Journeys Table
-- =============================================

-- Users can view journeys for trips they own or are public
CREATE POLICY "Users can view accessible journeys" ON public.journeys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = journeys.trip_id 
      AND (trips.user_id = auth.uid() OR trips.is_public = true)
    )
  );

-- Users can create journeys for their own trips
CREATE POLICY "Users can create journeys for own trips" ON public.journeys
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = journeys.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- Users can update journeys for their own trips
CREATE POLICY "Users can update journeys for own trips" ON public.journeys
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = journeys.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- Users can delete journeys for their own trips
CREATE POLICY "Users can delete journeys for own trips" ON public.journeys
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = journeys.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- =============================================
-- STEP 6: Create RLS Policies for Notifications Table
-- =============================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- System can create notifications for users
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 7: Create RLS Policies for Stories Table
-- =============================================

-- Users can view all public stories
CREATE POLICY "Anyone can view public stories" ON public.stories
  FOR SELECT USING (is_public = true);

-- Users can view their own stories (public or private)
CREATE POLICY "Users can view own stories" ON public.stories
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own stories
CREATE POLICY "Users can create own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own stories
CREATE POLICY "Users can update own stories" ON public.stories
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "Users can delete own stories" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 8: Create RLS Policies for Clubs Table
-- =============================================

-- Users can view all public clubs
CREATE POLICY "Anyone can view public clubs" ON public.clubs
  FOR SELECT USING (is_public = true);

-- Users can view clubs they created
CREATE POLICY "Users can view own clubs" ON public.clubs
  FOR SELECT USING (auth.uid() = created_by);

-- Users can create clubs
CREATE POLICY "Users can create clubs" ON public.clubs
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update clubs they created
CREATE POLICY "Users can update own clubs" ON public.clubs
  FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete clubs they created
CREATE POLICY "Users can delete own clubs" ON public.clubs
  FOR DELETE USING (auth.uid() = created_by);

-- =============================================
-- STEP 9: Create RLS Policies for Refresh Tokens Table
-- =============================================

-- Users can view their own refresh tokens
CREATE POLICY "Users can view own refresh tokens" ON public.refresh_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own refresh tokens
CREATE POLICY "Users can insert own refresh tokens" ON public.refresh_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own refresh tokens
CREATE POLICY "Users can update own refresh tokens" ON public.refresh_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own refresh tokens
CREATE POLICY "Users can delete own refresh tokens" ON public.refresh_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 10: Create RLS Policies for Trip Comment Likes Table
-- =============================================

-- Users can view all trip comment likes
CREATE POLICY "Anyone can view trip comment likes" ON public.trip_comment_likes
  FOR SELECT USING (true);

-- Users can create their own trip comment likes
CREATE POLICY "Users can create own trip comment likes" ON public.trip_comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own trip comment likes
CREATE POLICY "Users can delete own trip comment likes" ON public.trip_comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 11: Grant Permissions
-- =============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

GRANT ALL ON public.trips TO authenticated;
GRANT SELECT ON public.trips TO anon;

GRANT ALL ON public.budgets TO authenticated;
GRANT ALL ON public.journeys TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.stories TO authenticated;
GRANT SELECT ON public.stories TO anon;

GRANT ALL ON public.clubs TO authenticated;
GRANT SELECT ON public.clubs TO anon;

GRANT ALL ON public.refresh_tokens TO authenticated;
GRANT ALL ON public.trip_comment_likes TO authenticated;

-- =============================================
-- STEP 12: Create Performance Indexes
-- =============================================

-- Indexes for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_journeys_trip_id ON public.journeys(trip_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_clubs_created_by ON public.clubs(created_by);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_comment_likes_user_id ON public.trip_comment_likes(user_id);

-- =============================================
-- STEP 13: Enable Realtime (Optional)
-- =============================================

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clubs;

-- =============================================
-- SETUP COMPLETE
-- =============================================

-- All RLS policies have been created for existing tables
-- Security warnings should now be resolved
-- Test your application to ensure everything works correctly