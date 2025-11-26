# Manual RLS Setup Guide

Since the automated RLS setup script is having issues with the Supabase RPC functions, you can manually execute the RLS policies through the Supabase dashboard.

## Steps to Setup RLS Manually

1. **Go to your Supabase Dashboard**
   - Navigate to your project dashboard
   - Go to the SQL Editor

2. **Execute the following SQL commands one by one:**

### Enable RLS on existing tables:
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies for Users Table:
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow user registration (insert)
CREATE POLICY "Allow user registration" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Create RLS Policies for Trips Table:
```sql
-- Users can view their own trips
CREATE POLICY "Users can view own trips" ON public.trips
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own trips
CREATE POLICY "Users can create own trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own trips
CREATE POLICY "Users can update own trips" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own trips
CREATE POLICY "Users can delete own trips" ON public.trips
  FOR DELETE USING (auth.uid() = user_id);
```

### Create RLS Policies for Refresh Tokens Table:
```sql
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
```

### Create RLS Policies for Trip Comment Likes Table:
```sql
-- Users can view all trip comment likes
CREATE POLICY "Users can view trip comment likes" ON public.trip_comment_likes
  FOR SELECT USING (true);

-- Users can create their own trip comment likes
CREATE POLICY "Users can create own trip comment likes" ON public.trip_comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own trip comment likes
CREATE POLICY "Users can delete own trip comment likes" ON public.trip_comment_likes
  FOR DELETE USING (auth.uid() = user_id);
```

### Grant Permissions:
```sql
-- Grant permissions on tables
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

GRANT ALL ON public.trips TO authenticated;
GRANT SELECT ON public.trips TO anon;

GRANT ALL ON public.refresh_tokens TO authenticated;
GRANT ALL ON public.trip_comment_likes TO authenticated;
```

### Create Performance Indexes:
```sql
-- Indexes for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_comment_likes_user_id ON public.trip_comment_likes(user_id);
```

### Enable Realtime (Optional):
```sql
-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
```

## Verification

After running these commands:

1. Check the Supabase dashboard for any security warnings - they should be resolved
2. Test your application to ensure authentication and data access work correctly
3. Verify that users can only access their own data

## Notes

- The policies above only apply to existing tables in your database
- Tables like `budgets`, `journeys`, `notifications`, `stories`, and `clubs` are not included because they don't exist yet
- When you create these tables in the future, you'll need to add appropriate RLS policies for them
- The `role` column mentioned in some policies may need to be added to the users table manually