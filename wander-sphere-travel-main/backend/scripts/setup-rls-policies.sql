-- Enable Row Level Security (RLS) and create policies for WanderSphere database
-- This script addresses Supabase security advisor warnings

-- Enable RLS on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can read their own profile and other users' public profiles
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view other users' public profiles" ON public.users
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trips table policies
-- Users can view active trips
CREATE POLICY "Anyone can view active trips" ON public.trips
  FOR SELECT USING (is_active = true AND status = 'active');

-- Users can create trips
CREATE POLICY "Authenticated users can create trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own trips
CREATE POLICY "Users can update their own trips" ON public.trips
  FOR UPDATE USING (organizer_id = auth.uid());

-- Users can delete their own trips
CREATE POLICY "Users can delete their own trips" ON public.trips
  FOR DELETE USING (organizer_id = auth.uid());

-- Budgets table policies
-- Users can only access their own budgets
CREATE POLICY "Users can view their own budgets" ON public.budgets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own budgets" ON public.budgets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own budgets" ON public.budgets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own budgets" ON public.budgets
  FOR DELETE USING (user_id = auth.uid());

-- Journeys table policies
-- Users can view active journeys
CREATE POLICY "Anyone can view active journeys" ON public.journeys
  FOR SELECT USING (is_active = true);

-- Users can create journeys
CREATE POLICY "Authenticated users can create journeys" ON public.journeys
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own journeys
CREATE POLICY "Users can update their own journeys" ON public.journeys
  FOR UPDATE USING (author_id = auth.uid());

-- Users can delete their own journeys
CREATE POLICY "Users can delete their own journeys" ON public.journeys
  FOR DELETE USING (author_id = auth.uid());

-- Notifications table policies
-- Users can only access their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true); -- Allow system to create notifications

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- Stories table policies
-- Users can view active stories
CREATE POLICY "Anyone can view active stories" ON public.stories
  FOR SELECT USING (is_active = true);

-- Users can create stories
CREATE POLICY "Authenticated users can create stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own stories
CREATE POLICY "Users can update their own stories" ON public.stories
  FOR UPDATE USING (author_id = auth.uid());

-- Users can delete their own stories
CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE USING (author_id = auth.uid());

-- Clubs table policies
-- Users can view active clubs
CREATE POLICY "Anyone can view active clubs" ON public.clubs
  FOR SELECT USING (is_active = true);

-- Users can create clubs
CREATE POLICY "Authenticated users can create clubs" ON public.clubs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own clubs
CREATE POLICY "Users can update their own clubs" ON public.clubs
  FOR UPDATE USING (creator_id = auth.uid());

-- Users can delete their own clubs
CREATE POLICY "Users can delete their own clubs" ON public.clubs
  FOR DELETE USING (creator_id = auth.uid());

-- Refresh tokens table policies
-- Users can only access their own refresh tokens
CREATE POLICY "Users can view their own refresh tokens" ON public.refresh_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own refresh tokens" ON public.refresh_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own refresh tokens" ON public.refresh_tokens
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own refresh tokens" ON public.refresh_tokens
  FOR DELETE USING (user_id = auth.uid());

-- Trip comment likes table policies
-- Users can view all likes
CREATE POLICY "Anyone can view trip comment likes" ON public.trip_comment_likes
  FOR SELECT USING (true);

-- Users can create their own likes
CREATE POLICY "Users can create their own likes" ON public.trip_comment_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes" ON public.trip_comment_likes
  FOR DELETE USING (user_id = auth.uid());

-- Spatial reference system table policies (read-only for all)
CREATE POLICY "Anyone can read spatial reference data" ON public.spatial_ref_sys
  FOR SELECT USING (true);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant read access to anonymous users for public data
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.trips TO anon;
GRANT SELECT ON public.journeys TO anon;
GRANT SELECT ON public.stories TO anon;
GRANT SELECT ON public.clubs TO anon;
GRANT SELECT ON public.spatial_ref_sys TO anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_trips_organizer ON public.trips(organizer_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_journeys_author ON public.journeys(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_author ON public.stories(author_id);
CREATE INDEX IF NOT EXISTS idx_clubs_creator ON public.clubs(creator_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_comment_likes_user ON public.trip_comment_likes(user_id);

-- Add role column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Update RLS policies to include role-based access where needed
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ));

CREATE POLICY "Admins can update any user" ON public.users
  FOR UPDATE USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ));

CREATE POLICY "Admins can delete any user" ON public.users
  FOR DELETE USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ));

-- Add comments for documentation
COMMENT ON TABLE public.users IS 'User profiles and authentication data';
COMMENT ON TABLE public.trips IS 'Travel trips and adventures';
COMMENT ON TABLE public.budgets IS 'User budget tracking and management';
COMMENT ON TABLE public.journeys IS 'Travel journals and experiences';
COMMENT ON TABLE public.notifications IS 'User notifications and alerts';
COMMENT ON TABLE public.stories IS 'User travel stories and content';
COMMENT ON TABLE public.clubs IS 'Travel clubs and communities';
COMMENT ON TABLE public.refresh_tokens IS 'Authentication refresh tokens';
COMMENT ON TABLE public.trip_comment_likes IS 'Likes on trip comments';
COMMENT ON TABLE public.spatial_ref_sys IS 'Spatial reference system data';

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journeys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clubs;

SELECT 'RLS policies and security setup completed successfully!' as result;