# How to Delete Existing Database in Supabase

## Overview
This guide will help you completely delete your existing database tables in Supabase and start fresh with a clean setup.

## ⚠️ WARNING
**This process will permanently delete ALL your data. Make sure you have backups if needed!**

## Method 1: Using Supabase SQL Editor (Recommended)

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query** to create a new SQL script

### Step 2: Execute Database Cleanup Script

Copy and paste this SQL script into the SQL Editor:

```sql
-- =============================================
-- COMPLETE DATABASE CLEANUP SCRIPT
-- =============================================
-- WARNING: This will delete ALL existing data!

-- Step 1: Drop all existing tables in correct order
-- (Drop in reverse dependency order to avoid foreign key conflicts)

DROP TABLE IF EXISTS public.trip_participants CASCADE;
DROP TABLE IF EXISTS public.trip_comment_likes CASCADE;
DROP TABLE IF EXISTS public.trip_comments CASCADE;
DROP TABLE IF EXISTS public.trip_likes CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.journeys CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.clubs CASCADE;
DROP TABLE IF EXISTS public.user_relationships CASCADE;
DROP TABLE IF EXISTS public.blocked_users CASCADE;
DROP TABLE IF EXISTS public.refresh_tokens CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 2: Drop any remaining custom functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Step 3: Drop any custom types (if any exist)
-- Add any custom types you may have created

-- Step 4: Reset sequences (if any custom ones exist)
-- This ensures ID sequences start from 1 again

-- Step 5: Clean up any remaining objects
-- Drop any views that might reference the tables
DROP VIEW IF EXISTS user_stats CASCADE;
DROP VIEW IF EXISTS trip_stats CASCADE;

-- Verification: Check remaining tables
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Step 3: Execute the Script
1. Click **Run** to execute the cleanup script
2. Check the results - you should see "DROP TABLE" confirmations
3. The final SELECT query should show minimal or no custom tables

## Method 2: Using Supabase Dashboard (Table by Table)

### Alternative Manual Approach
If you prefer a more controlled approach:

1. Go to **Table Editor** in your Supabase dashboard
2. For each table you want to delete:
   - Click on the table name
   - Click the **Settings** tab
   - Scroll down and click **Delete table**
   - Confirm the deletion

**Delete tables in this order to avoid foreign key conflicts:**
1. trip_participants
2. trip_comment_likes
3. trip_comments
4. trip_likes
5. stories
6. notifications
7. journeys
8. budgets
9. clubs
10. user_relationships
11. blocked_users
12. refresh_tokens
13. trips
14. users

## Method 3: Reset Entire Database (Nuclear Option)

### Complete Project Reset
If you want to completely reset everything:

1. Go to your Supabase project **Settings**
2. Navigate to **General** settings
3. Scroll down to **Danger Zone**
4. Click **Delete Project**
5. Create a new project with the same name
6. Update your environment variables with new URLs and keys

**Note:** This will require updating your `.env` files with new Supabase credentials.

## Verification After Deletion

Run this query to verify all tables are deleted:

```sql
-- Check remaining public tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Should return minimal system tables only
```

## What Happens After Deletion

After successful deletion:
- ✅ All custom tables are removed
- ✅ All data is permanently deleted
- ✅ All foreign key relationships are removed
- ✅ All indexes are automatically dropped
- ✅ All RLS policies are removed
- ✅ Database is ready for fresh setup

## Next Steps After Deletion

Once you've successfully deleted the existing database:

1. **Run Fresh Database Setup**
   ```bash
   node backend/scripts/setup-fresh-database.js
   ```

2. **Or Manual Setup**
   - Execute `fresh-database-setup.sql` in SQL Editor
   - Execute `fresh-rls-policies.sql` in SQL Editor

3. **Verify New Setup**
   - Check that all 14 tables are created
   - Verify RLS is enabled
   - Test basic functionality

## Troubleshooting

### Common Issues

**"cannot drop table because other objects depend on it"**
- Solution: Use `CASCADE` in DROP statements (already included in script)
- Or delete dependent objects first

**"table does not exist"**
- This is normal if the table was already deleted
- The `IF EXISTS` clause prevents errors

**"permission denied"**
- Ensure you're using the service role key
- Check that you have admin privileges

### Recovery Options

If you need to recover data:
1. **Supabase Backups**: Check if automatic backups are available
2. **Manual Exports**: If you exported data before deletion
3. **Version Control**: If you have database migration scripts

## Safety Checklist

Before proceeding with deletion:
- [ ] Backup important data if needed
- [ ] Confirm you want to start completely fresh
- [ ] Update team members about the reset
- [ ] Have fresh setup scripts ready
- [ ] Verify environment variables are correct

---

**Remember**: This is a destructive operation. Once executed, your data cannot be recovered unless you have backups.