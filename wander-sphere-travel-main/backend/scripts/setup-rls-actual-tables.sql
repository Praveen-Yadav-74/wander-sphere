-- RLS Setup Script for Actually Existing Tables Only
-- Based on your actual Supabase database schema

-- =============================================
-- STEP 1: Enable RLS on Existing Tables
-- =============================================

-- Core application tables that exist
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Note: Skipping spatial_ref_sys, geography_columns, geometry_columns as they are system tables

-- =============================================
-- STEP 2: Create RLS Policies for Users Table
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view public trips" ON public.trips;
DROP POLICY IF EXISTS "Users can create own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;

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
-- STEP 4: Create RLS Policies for Trip Comments Table
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view trip comments" ON public.trip_comments;
DROP POLICY IF EXISTS "Users can create own trip comments" ON public.trip_comments;
DROP POLICY IF EXISTS "Users can update own trip comments" ON public.trip_comments;
DROP POLICY IF EXISTS "Users can delete own trip comments" ON public.trip_comments;

-- Users can view all trip comments
CREATE POLICY "Anyone can view trip comments" ON public.trip_comments
  FOR SELECT USING (true);

-- Users can create their own trip comments
CREATE POLICY "Users can create own trip comments" ON public.trip_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own trip comments
CREATE POLICY "Users can update own trip comments" ON public.trip_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own trip comments
CREATE POLICY "Users can delete own trip comments" ON public.trip_comments
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 5: Create RLS Policies for Trip Likes Table
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view trip likes" ON public.trip_likes;
DROP POLICY IF EXISTS "Users can create own trip likes" ON public.trip_likes;
DROP POLICY IF EXISTS "Users can delete own trip likes" ON public.trip_likes;

-- Users can view all trip likes
CREATE POLICY "Anyone can view trip likes" ON public.trip_likes
  FOR SELECT USING (true);

-- Users can create their own trip likes
CREATE POLICY "Users can create own trip likes" ON public.trip_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own trip likes
CREATE POLICY "Users can delete own trip likes" ON public.trip_likes
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 6: Create RLS Policies for Trip Comment Likes Table
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view trip comment likes" ON public.trip_comment_likes;
DROP POLICY IF EXISTS "Users can create own trip comment likes" ON public.trip_comment_likes;
DROP POLICY IF EXISTS "Users can delete own trip comment likes" ON public.trip_comment_likes;

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
-- STEP 7: Create RLS Policies for Trip Participants Table
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view trip participants" ON public.trip_participants;
DROP POLICY IF EXISTS "Trip owners can add participants" ON public.trip_participants;
DROP POLICY IF EXISTS "Users can remove themselves from trips" ON public.trip_participants;
DROP POLICY IF EXISTS "Trip owners can remove participants" ON public.trip_participants;

-- Users can view trip participants for trips they can see
CREATE POLICY "Anyone can view trip participants" ON public.trip_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_participants.trip_id
    )
  );

-- Trip owners can add participants to their trips
CREATE POLICY "Trip owners can add participants" ON public.trip_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_participants.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- Trip owners can remove participants from their trips
CREATE POLICY "Trip owners can remove participants" ON public.trip_participants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trips 
      WHERE trips.id = trip_participants.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- Users can remove themselves from trips
CREATE POLICY "Users can remove themselves from trips" ON public.trip_participants
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 8: Create RLS Policies for User Relationships Table
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own relationships" ON public.user_relationships;
DROP POLICY IF EXISTS "Users can create own relationships" ON public.user_relationships;
DROP POLICY IF EXISTS "Users can delete own relationships" ON public.user_relationships;

-- Users can view their own relationships
CREATE POLICY "Users can view own relationships" ON public.user_relationships
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Users can create relationships (follow others)
CREATE POLICY "Users can create relationships" ON public.user_relationships
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can delete relationships (unfollow)
CREATE POLICY "Users can delete relationships" ON public.user_relationships
  FOR DELETE USING (auth.uid() = follower_id);

-- =============================================
-- STEP 9: Create RLS Policies for Blocked Users Table
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own blocked users" ON public.blocked_users;
DROP POLICY IF EXISTS "Users can block other users" ON public.blocked_users;
DROP POLICY IF EXISTS "Users can unblock other users" ON public.blocked_users;

-- Users can view their own blocked users
CREATE POLICY "Users can view own blocked users" ON public.blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

-- Users can block other users
CREATE POLICY "Users can block others" ON public.blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- Users can unblock other users
CREATE POLICY "Users can unblock others" ON public.blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- =============================================
-- STEP 10: Create RLS Policies for Refresh Tokens Table
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can access own refresh tokens" ON public.refresh_tokens;

-- Users can only access their own refresh tokens
CREATE POLICY "Users can access own refresh tokens" ON public.refresh_tokens
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

GRANT ALL ON public.trip_comments TO authenticated;
GRANT SELECT ON public.trip_comments TO anon;

GRANT ALL ON public.trip_likes TO authenticated;
GRANT ALL ON public.trip_comment_likes TO authenticated;
GRANT ALL ON public.trip_participants TO authenticated;
GRANT ALL ON public.user_relationships TO authenticated;
GRANT ALL ON public.blocked_users TO authenticated;
GRANT ALL ON public.refresh_tokens TO authenticated;

-- =============================================
-- STEP 12: Create Performance Indexes
-- =============================================

-- Indexes for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_comments_user_id ON public.trip_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_likes_user_id ON public.trip_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_comment_likes_user_id ON public.trip_comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_trip_id ON public.trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_user_id ON public.trip_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_follower ON public.user_relationships(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_following ON public.user_relationships(following_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);

-- =============================================
-- STEP 13: Enable Realtime (Optional)
-- =============================================

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_comment_likes;

-- =============================================
-- SETUP COMPLETE
-- =============================================

-- All RLS policies have been created for actually existing tables
-- This script will not produce "relation does not exist" errors
-- Test your application to ensure everything works correctly