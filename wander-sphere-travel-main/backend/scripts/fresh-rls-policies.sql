-- =============================================
-- ROW LEVEL SECURITY POLICIES FOR FRESH DATABASE
-- =============================================
-- Run this AFTER creating the fresh database
-- This script sets up comprehensive RLS policies

-- =============================================
-- STEP 1: Enable RLS on all tables
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 2: Users Table Policies
-- =============================================

-- Users can view their own profile and public profiles
CREATE POLICY "Users can view public profiles" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR 
        is_active = true AND 
        (privacy_settings->>'profile_visibility' = 'public' OR 
         privacy_settings->>'profile_visibility' IS NULL)
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (registration)
CREATE POLICY "Users can create own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users cannot delete profiles (soft delete via is_active)
CREATE POLICY "Prevent user deletion" ON public.users
    FOR DELETE USING (false);

-- =============================================
-- STEP 3: Trips Table Policies
-- =============================================

-- Users can view public trips, their own trips, and trips they're invited to
CREATE POLICY "Users can view accessible trips" ON public.trips
    FOR SELECT USING (
        visibility = 'public' OR
        user_id = auth.uid() OR
        id IN (
            SELECT trip_id FROM public.trip_participants 
            WHERE user_id = auth.uid() AND status = 'accepted'
        )
    );

-- Users can create their own trips
CREATE POLICY "Users can create own trips" ON public.trips
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own trips
CREATE POLICY "Users can update own trips" ON public.trips
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own trips
CREATE POLICY "Users can delete own trips" ON public.trips
    FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- STEP 4: Budgets Table Policies
-- =============================================

-- Users can view their own budgets and budgets for trips they participate in
CREATE POLICY "Users can view accessible budgets" ON public.budgets
    FOR SELECT USING (
        user_id = auth.uid() OR
        trip_id IN (
            SELECT trip_id FROM public.trip_participants 
            WHERE user_id = auth.uid() AND status = 'accepted'
        )
    );

-- Users can create budgets for their trips or trips they participate in
CREATE POLICY "Users can create budgets" ON public.budgets
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR
        trip_id IN (
            SELECT trip_id FROM public.trip_participants 
            WHERE user_id = auth.uid() AND status = 'accepted'
        )
    );

-- Users can update their own budgets
CREATE POLICY "Users can update own budgets" ON public.budgets
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own budgets
CREATE POLICY "Users can delete own budgets" ON public.budgets
    FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- STEP 5: Journeys Table Policies
-- =============================================

-- Users can view public journeys and their own journeys
CREATE POLICY "Users can view accessible journeys" ON public.journeys
    FOR SELECT USING (
        is_public = true OR
        user_id = auth.uid()
    );

-- Users can create their own journeys
CREATE POLICY "Users can create own journeys" ON public.journeys
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own journeys
CREATE POLICY "Users can update own journeys" ON public.journeys
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own journeys
CREATE POLICY "Users can delete own journeys" ON public.journeys
    FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- STEP 6: Stories Table Policies
-- =============================================

-- Users can view public stories and their own stories
CREATE POLICY "Users can view accessible stories" ON public.stories
    FOR SELECT USING (
        (is_public = true AND status = 'published') OR
        user_id = auth.uid()
    );

-- Users can create their own stories
CREATE POLICY "Users can create own stories" ON public.stories
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own stories
CREATE POLICY "Users can update own stories" ON public.stories
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own stories
CREATE POLICY "Users can delete own stories" ON public.stories
    FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- STEP 7: Clubs Table Policies
-- =============================================

-- Users can view public clubs and clubs they created
CREATE POLICY "Users can view accessible clubs" ON public.clubs
    FOR SELECT USING (
        is_public = true OR
        created_by = auth.uid()
    );

-- Users can create clubs
CREATE POLICY "Users can create clubs" ON public.clubs
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update clubs they created
CREATE POLICY "Users can update own clubs" ON public.clubs
    FOR UPDATE USING (created_by = auth.uid());

-- Users can delete clubs they created
CREATE POLICY "Users can delete own clubs" ON public.clubs
    FOR DELETE USING (created_by = auth.uid());

-- =============================================
-- STEP 8: Notifications Table Policies
-- =============================================

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- System can create notifications for users
CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- STEP 9: Trip Participants Table Policies
-- =============================================

-- Users can view participants of trips they can access
CREATE POLICY "Users can view trip participants" ON public.trip_participants
    FOR SELECT USING (
        user_id = auth.uid() OR
        trip_id IN (
            SELECT id FROM public.trips 
            WHERE user_id = auth.uid() OR visibility = 'public'
        )
    );

-- Trip owners can add participants
CREATE POLICY "Trip owners can add participants" ON public.trip_participants
    FOR INSERT WITH CHECK (
        trip_id IN (
            SELECT id FROM public.trips WHERE user_id = auth.uid()
        )
    );

-- Users can update their own participation status
CREATE POLICY "Users can update own participation" ON public.trip_participants
    FOR UPDATE USING (
        user_id = auth.uid() OR
        trip_id IN (
            SELECT id FROM public.trips WHERE user_id = auth.uid()
        )
    );

-- Trip owners and participants can remove participation
CREATE POLICY "Users can remove participation" ON public.trip_participants
    FOR DELETE USING (
        user_id = auth.uid() OR
        trip_id IN (
            SELECT id FROM public.trips WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- STEP 10: Trip Comments Table Policies
-- =============================================

-- Users can view comments on trips they can access
CREATE POLICY "Users can view trip comments" ON public.trip_comments
    FOR SELECT USING (
        trip_id IN (
            SELECT id FROM public.trips 
            WHERE visibility = 'public' OR 
                  user_id = auth.uid() OR
                  id IN (
                      SELECT trip_id FROM public.trip_participants 
                      WHERE user_id = auth.uid() AND status = 'accepted'
                  )
        )
    );

-- Users can create comments on accessible trips
CREATE POLICY "Users can create trip comments" ON public.trip_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        trip_id IN (
            SELECT id FROM public.trips 
            WHERE visibility = 'public' OR 
                  user_id = auth.uid() OR
                  id IN (
                      SELECT trip_id FROM public.trip_participants 
                      WHERE user_id = auth.uid() AND status = 'accepted'
                  )
        )
    );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON public.trip_comments
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON public.trip_comments
    FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- STEP 11: Trip Likes Table Policies
-- =============================================

-- Users can view likes on accessible trips
CREATE POLICY "Users can view trip likes" ON public.trip_likes
    FOR SELECT USING (
        trip_id IN (
            SELECT id FROM public.trips 
            WHERE visibility = 'public' OR user_id = auth.uid()
        )
    );

-- Users can like accessible trips
CREATE POLICY "Users can like trips" ON public.trip_likes
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        trip_id IN (
            SELECT id FROM public.trips 
            WHERE visibility = 'public' OR user_id = auth.uid()
        )
    );

-- Users can remove their own likes
CREATE POLICY "Users can remove own likes" ON public.trip_likes
    FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- STEP 12: Trip Comment Likes Table Policies
-- =============================================

-- Users can view comment likes
CREATE POLICY "Users can view comment likes" ON public.trip_comment_likes
    FOR SELECT USING (
        comment_id IN (
            SELECT id FROM public.trip_comments
            WHERE trip_id IN (
                SELECT id FROM public.trips 
                WHERE visibility = 'public' OR user_id = auth.uid()
            )
        )
    );

-- Users can like comments
CREATE POLICY "Users can like comments" ON public.trip_comment_likes
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        comment_id IN (
            SELECT id FROM public.trip_comments
            WHERE trip_id IN (
                SELECT id FROM public.trips 
                WHERE visibility = 'public' OR user_id = auth.uid()
            )
        )
    );

-- Users can remove their own comment likes
CREATE POLICY "Users can remove own comment likes" ON public.trip_comment_likes
    FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- STEP 13: User Relationships Table Policies
-- =============================================

-- Users can view relationships involving them
CREATE POLICY "Users can view own relationships" ON public.user_relationships
    FOR SELECT USING (
        follower_id = auth.uid() OR following_id = auth.uid()
    );

-- Users can create relationships (follow others)
CREATE POLICY "Users can create relationships" ON public.user_relationships
    FOR INSERT WITH CHECK (follower_id = auth.uid());

-- Users can update relationships they initiated
CREATE POLICY "Users can update own relationships" ON public.user_relationships
    FOR UPDATE USING (
        follower_id = auth.uid() OR following_id = auth.uid()
    );

-- Users can delete relationships they're involved in
CREATE POLICY "Users can delete own relationships" ON public.user_relationships
    FOR DELETE USING (
        follower_id = auth.uid() OR following_id = auth.uid()
    );

-- =============================================
-- STEP 14: Blocked Users Table Policies
-- =============================================

-- Users can view their own blocks
CREATE POLICY "Users can view own blocks" ON public.blocked_users
    FOR SELECT USING (blocker_id = auth.uid());

-- Users can block others
CREATE POLICY "Users can block others" ON public.blocked_users
    FOR INSERT WITH CHECK (blocker_id = auth.uid());

-- Users can unblock others
CREATE POLICY "Users can unblock others" ON public.blocked_users
    FOR DELETE USING (blocker_id = auth.uid());

-- =============================================
-- STEP 15: Refresh Tokens Table Policies
-- =============================================

-- Users can view their own refresh tokens
CREATE POLICY "Users can view own tokens" ON public.refresh_tokens
    FOR SELECT USING (user_id = auth.uid());

-- System can create refresh tokens
CREATE POLICY "System can create tokens" ON public.refresh_tokens
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can delete their own refresh tokens
CREATE POLICY "Users can delete own tokens" ON public.refresh_tokens
    FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- STEP 16: Grant Permissions
-- =============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================
-- STEP 17: Enable Realtime
-- =============================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_relationships;

-- =============================================
-- RLS SETUP COMPLETE
-- =============================================

-- All tables now have comprehensive RLS policies
-- Users can only access data they own or have permission to view
-- Security is enforced at the database level
-- Realtime is enabled for interactive features