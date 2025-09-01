# Supabase Row Level Security (RLS) Setup Guide

This guide will help you manually set up Row Level Security (RLS) policies in your Supabase dashboard to address the security advisor warnings.

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project: `gserzaenfrmrqoffzcxr`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

## Step 2: Enable RLS on Tables

Copy and paste the following SQL commands one by one in the SQL Editor:

### Enable RLS on Core Tables
```sql
-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
```

### Enable RLS on Additional Tables (if they exist)
```sql
-- Enable RLS on additional tables (run only if these tables exist)
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
```

## Step 3: Create RLS Policies

### Users Table Policies
```sql
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can view other users' public profiles
CREATE POLICY "Users can view public profiles" ON public.users
  FOR SELECT USING (is_active = true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Trips Table Policies
```sql
-- Anyone can view active trips
CREATE POLICY "Anyone can view active trips" ON public.trips
  FOR SELECT USING (is_active = true AND status = 'active');

-- Authenticated users can create trips
CREATE POLICY "Authenticated users can create trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own trips
CREATE POLICY "Users can update their own trips" ON public.trips
  FOR UPDATE USING (organizer_id = auth.uid());

-- Users can delete their own trips
CREATE POLICY "Users can delete their own trips" ON public.trips
  FOR DELETE USING (organizer_id = auth.uid());
```

### Refresh Tokens Table Policies
```sql
-- Users can only access their own refresh tokens
CREATE POLICY "Users can view their own refresh tokens" ON public.refresh_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own refresh tokens" ON public.refresh_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own refresh tokens" ON public.refresh_tokens
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own refresh tokens" ON public.refresh_tokens
  FOR DELETE USING (user_id = auth.uid());
```

### Trip Comment Likes Table Policies
```sql
-- Anyone can view trip comment likes
CREATE POLICY "Anyone can view trip comment likes" ON public.trip_comment_likes
  FOR SELECT USING (true);

-- Users can create their own likes
CREATE POLICY "Users can create their own likes" ON public.trip_comment_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes" ON public.trip_comment_likes
  FOR DELETE USING (user_id = auth.uid());
```

### Spatial Reference System Table Policies
```sql
-- Read-only access for spatial reference data
CREATE POLICY "Anyone can read spatial reference data" ON public.spatial_ref_sys
  FOR SELECT USING (true);
```

## Step 4: Create Policies for Additional Tables (Optional)

If you have these tables, add the following policies:

### Budgets Table Policies
```sql
-- Users can only access their own budgets
CREATE POLICY "Users can view their own budgets" ON public.budgets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own budgets" ON public.budgets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own budgets" ON public.budgets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own budgets" ON public.budgets
  FOR DELETE USING (user_id = auth.uid());
```

### Notifications Table Policies
```sql
-- Users can only access their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());
```

### Journeys Table Policies
```sql
-- Users can view active journeys
CREATE POLICY "Anyone can view active journeys" ON public.journeys
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create journeys" ON public.journeys
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own journeys" ON public.journeys
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own journeys" ON public.journeys
  FOR DELETE USING (author_id = auth.uid());
```

## Step 5: Add Missing Role Column

If the `role` column is missing from the users table:

```sql
-- Add role column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
```

## Step 6: Grant Permissions

```sql
-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant read access to anonymous users for public data
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.trips TO anon;
GRANT SELECT ON public.spatial_ref_sys TO anon;
```

## Step 7: Create Performance Indexes

```sql
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_trips_organizer ON public.trips(organizer_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_comment_likes_user ON public.trip_comment_likes(user_id);
```

## Step 8: Verify Setup

1. Go to **Authentication** > **Policies** in your Supabase dashboard
2. Check that RLS is enabled on all tables
3. Verify that policies are created and active
4. Test your application to ensure everything works correctly

## Troubleshooting

### Common Issues:

1. **Policy already exists error**: This is normal if you're re-running commands
2. **Table doesn't exist error**: Skip policies for tables that don't exist in your schema
3. **Permission denied**: Make sure you're using the service role key or are logged in as the project owner

### Testing RLS:

1. Try accessing data through your application
2. Check the Supabase logs for any RLS-related errors
3. Use the Supabase dashboard's table editor to test data access

## Security Benefits

After implementing these policies:

✅ Users can only access their own data
✅ Public data is accessible to everyone
✅ Authenticated users can create content
✅ Data integrity is maintained
✅ Security advisor warnings are resolved

## Next Steps

1. Test your application thoroughly
2. Monitor the Supabase logs for any issues
3. Adjust policies as needed based on your application requirements
4. Consider implementing additional security measures like rate limiting

---

**Note**: Always test these policies in a development environment before applying them to production!