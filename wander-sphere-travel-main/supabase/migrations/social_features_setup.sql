-- =============================================
-- Social Network Features Migration
-- Adds follow system and private accounts
-- =============================================

-- =============================================
-- PART 1: Add is_private Column to Users Table
-- =============================================

-- Add is_private column to users table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_private'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN is_private BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN users.is_private IS 
        'If true, only approved followers can see this user''s posts';
    END IF;
END $$;

-- =============================================
-- PART 2: Create Follows Table
-- =============================================

-- Create follows table for user relationships
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent self-follows
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    
    -- Prevent duplicate follows
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

COMMENT ON TABLE follows IS 'User follow relationships for social network features';
COMMENT ON COLUMN follows.follower_id IS 'User who is following';
COMMENT ON COLUMN follows.following_id IS 'User being followed';

-- =============================================
-- PART 3: Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on follows table
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all follow relationships
CREATE POLICY "Anyone can view follows"
    ON follows FOR SELECT
    USING (true);

-- Policy: Users can only create follows for themselves
CREATE POLICY "Users can follow others"
    ON follows FOR INSERT
    WITH CHECK (
        auth.uid() = follower_id
    );

-- Policy: Users can only delete their own follows
CREATE POLICY "Users can unfollow"
    ON follows FOR DELETE
    USING (
        auth.uid() = follower_id
    );

-- =============================================
-- PART 4: Helper Functions
-- =============================================

-- Function to check if user A follows user B
CREATE OR REPLACE FUNCTION is_following(
    follower UUID,
    following UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM follows
        WHERE follower_id = follower
        AND following_id = following
    );
$$;

COMMENT ON FUNCTION is_following(UUID, UUID) IS 
'Check if one user follows another. Usage: SELECT is_following(user1_id, user2_id);';

-- Function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
    SELECT COUNT(*)::INTEGER
    FROM follows
    WHERE following_id = user_id;
$$;

COMMENT ON FUNCTION get_follower_count(UUID) IS 
'Get the number of followers for a user. Usage: SELECT get_follower_count(user_id);';

-- Function to get following count
CREATE OR REPLACE FUNCTION get_following_count(user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
    SELECT COUNT(*)::INTEGER
    FROM follows
    WHERE follower_id = user_id;
$$;

COMMENT ON FUNCTION get_following_count(UUID) IS 
'Get the number of users this user is following. Usage: SELECT get_following_count(user_id);';

-- Function to get user's followers
CREATE OR REPLACE FUNCTION get_followers(user_id UUID)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    avatar_url TEXT,
    is_private BOOLEAN,
    followed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.username,
        u.avatar_url,
        u.is_private,
        f.created_at AS followed_at
    FROM follows f
    JOIN users u ON f.follower_id = u.id
    WHERE f.following_id = user_id
    ORDER BY f.created_at DESC;
$$;

COMMENT ON FUNCTION get_followers(UUID) IS 
'Get all followers for a user. Usage: SELECT * FROM get_followers(user_id);';

-- Function to get users being followed
CREATE OR REPLACE FUNCTION get_following(user_id UUID)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    avatar_url TEXT,
    is_private BOOLEAN,
    followed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.username,
        u.avatar_url,
        u.is_private,
        f.created_at AS followed_at
    FROM follows f
    JOIN users u ON f.following_id = u.id
    WHERE f.follower_id = user_id
    ORDER BY f.created_at DESC;
$$;

COMMENT ON FUNCTION get_following(UUID) IS 
'Get all users this user is following. Usage: SELECT * FROM get_following(user_id);';

-- Function to get suggested users (users not being followed)
CREATE OR REPLACE FUNCTION get_suggested_users(
    for_user_id UUID,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_private BOOLEAN,
    follower_count INTEGER
)
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.username,
        u.avatar_url,
        u.bio,
        u.is_private,
        get_follower_count(u.id) AS follower_count
    FROM users u
    WHERE u.id != for_user_id  -- Exclude self
    AND u.id NOT IN (
        -- Exclude users already being followed
        SELECT following_id 
        FROM follows 
        WHERE follower_id = for_user_id
    )
    AND u.is_active = true  -- Only active users
    ORDER BY RANDOM()  -- Random suggestions
    LIMIT limit_count;
$$;

COMMENT ON FUNCTION get_suggested_users(UUID, INTEGER) IS 
'Get random suggested users to follow. Usage: SELECT * FROM get_suggested_users(user_id, 10);';

-- =============================================
-- PART 5: Update Posts/Journeys View Logic
-- =============================================

-- Function to check if user can view another user's post
-- Based on: public account OR following private account OR own post
CREATE OR REPLACE FUNCTION can_view_user_content(
    viewer_id UUID,
    content_owner_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT (
        -- Own content
        viewer_id = content_owner_id
        OR
        -- Public account
        NOT EXISTS (
            SELECT 1 FROM users 
            WHERE id = content_owner_id 
            AND is_private = true
        )
        OR
        -- Following private account
        EXISTS (
            SELECT 1 FROM follows
            WHERE follower_id = viewer_id
            AND following_id = content_owner_id
        )
    );
$$;

COMMENT ON FUNCTION can_view_user_content(UUID, UUID) IS 
'Check if a user can view another user''s content based on privacy settings and follow status';

-- =============================================
-- PART 6: Verification Queries
-- =============================================

-- Verify is_private column exists
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'is_private';

-- Verify follows table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'follows'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'follows';

-- Test follow functions (example)
-- SELECT is_following('user1-uuid', 'user2-uuid');
-- SELECT get_follower_count('user-uuid');
-- SELECT * FROM get_followers('user-uuid');
-- SELECT * FROM get_suggested_users('user-uuid', 5);

-- =============================================
-- SETUP COMPLETE
-- =============================================

/*
USAGE EXAMPLES:

1. Follow a user:
   INSERT INTO follows (follower_id, following_id)
   VALUES (current_user_id, target_user_id);

2. Unfollow a user:
   DELETE FROM follows
   WHERE follower_id = current_user_id
   AND following_id = target_user_id;

3. Check if following:
   SELECT is_following(current_user_id, target_user_id);

4. Get followers:
   SELECT * FROM get_followers(user_id);

5. Get following:
   SELECT * FROM get_following(user_id);

6. Get suggested users:
   SELECT * FROM get_suggested_users(current_user_id, 10);

7. Make account private:
   UPDATE users SET is_private = true WHERE id = user_id;

8. Check if user can view content:
   SELECT can_view_user_content(viewer_id, content_owner_id);
*/
