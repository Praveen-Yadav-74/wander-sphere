# Manual Fresh Database Setup Guide

## Overview
This guide will help you set up a completely fresh database for the Wander Sphere Travel application using the Supabase SQL Editor.

## Prerequisites
- Access to your Supabase project dashboard
- Admin privileges on the database

## Step-by-Step Instructions

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query** to create a new SQL script

### Step 2: Execute Database Setup Script

1. Copy the entire content from `fresh-database-setup.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the script

**What this does:**
- Drops any existing tables (clean slate)
- Creates all required tables with proper relationships
- Adds performance indexes
- Sets up automatic timestamp triggers

### Step 3: Execute RLS Policies Script

1. Copy the entire content from `fresh-rls-policies.sql`
2. Paste it into a new SQL Editor query
3. Click **Run** to execute the script

**What this does:**
- Enables Row Level Security on all tables
- Creates comprehensive security policies
- Sets up proper permissions
- Enables realtime for interactive features

### Step 4: Verify Setup

Run this verification query in the SQL Editor:

```sql
-- Check if all tables exist
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'users', 'trips', 'budgets', 'journeys', 'stories', 'clubs',
        'notifications', 'trip_participants', 'trip_comments', 
        'trip_likes', 'trip_comment_likes', 'user_relationships',
        'blocked_users', 'refresh_tokens'
    )
ORDER BY tablename;
```

**Expected Result:** You should see 14 tables, all with `rls_enabled = true`

### Step 5: Test Basic Functionality

Try inserting a test user (replace with your actual auth.uid()):

```sql
-- Test user creation (use your actual auth.uid())
INSERT INTO public.users (
    id, email, first_name, last_name, username
) VALUES (
    'your-auth-uid-here',
    'test@example.com',
    'Test',
    'User',
    'testuser'
);

-- Verify the user was created
SELECT id, email, first_name, last_name, username, created_at 
FROM public.users 
WHERE email = 'test@example.com';
```

### Step 6: Clean Up Test Data (Optional)

```sql
-- Remove test user
DELETE FROM public.users WHERE email = 'test@example.com';
```

## Database Schema Overview

### Core Tables
- **users**: User profiles and authentication data
- **trips**: Travel plans and trip information
- **budgets**: Budget tracking for trips
- **journeys**: Daily travel logs and experiences
- **stories**: Travel stories and blog posts
- **clubs**: Travel communities and groups
- **notifications**: User notifications system

### Relationship Tables
- **trip_participants**: Users participating in trips
- **trip_comments**: Comments on trips
- **trip_likes**: Trip likes/favorites
- **trip_comment_likes**: Likes on comments
- **user_relationships**: Friend/follow relationships
- **blocked_users**: User blocking system
- **refresh_tokens**: Authentication token management

## Security Features

### Row Level Security (RLS)
- **Enabled on all tables** for maximum security
- **User isolation**: Users can only access their own data
- **Public content**: Public trips/stories are accessible to all
- **Relationship-based access**: Participants can access shared trip data

### Key Security Policies
- Users can only view/edit their own profiles
- Trip access based on ownership or participation
- Comments and likes restricted to accessible trips
- Notifications are user-specific
- Blocking system prevents unwanted interactions

## Performance Optimizations

### Indexes Created
- **Email and username lookups** for fast user searches
- **Trip filtering** by date, location, and tags
- **Relationship queries** for social features
- **Notification delivery** for real-time updates

### Realtime Features
- **Trips**: Live updates for collaborative planning
- **Comments**: Real-time discussion threads
- **Likes**: Instant feedback on content
- **Notifications**: Immediate delivery
- **Relationships**: Live friend/follow updates

## Troubleshooting

### Common Issues

1. **"relation does not exist" errors**
   - Ensure Step 2 (database setup) completed successfully
   - Check that all tables were created

2. **"permission denied" errors**
   - Ensure Step 3 (RLS policies) completed successfully
   - Verify you're using the correct user authentication

3. **"function does not exist" errors**
   - Some policies reference auth.uid() - ensure Supabase auth is properly configured
   - Check that the service role key has proper permissions

### Verification Queries

```sql
-- Check table count
SELECT COUNT(*) as table_count 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Check indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

## Next Steps

After completing the database setup:

1. **Test your application** - Start your backend server and test API endpoints
2. **Create user accounts** - Test the registration and authentication flow
3. **Test core features** - Create trips, add comments, test social features
4. **Monitor performance** - Check query performance and optimize if needed

## Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify environment variables in your `.env` file
3. Ensure your Supabase service role key has proper permissions
4. Review the SQL execution results for any error messages

---

**Note**: This setup creates a production-ready database with comprehensive security and performance optimizations. All data access is properly secured through Row Level Security policies.