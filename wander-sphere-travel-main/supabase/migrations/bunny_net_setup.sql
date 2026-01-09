-- =============================================
-- Bunny.net Integration Setup for Supabase
-- =============================================
-- This SQL script sets up:
-- 1. Database schema updates (storage_path column for stories)
-- 2. pg_cron extension for automated cleanup
-- 3. Scheduled job to run cleanup every hour
-- 4. Helper functions for manual cleanup
-- =============================================

-- =============================================
-- PART 1: Update Stories Table
-- =============================================

-- Add storage_path column to stories table (if not exists)
-- This stores the relative path in Bunny.net storage for deletion
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stories' 
        AND column_name = 'storage_path'
    ) THEN
        ALTER TABLE stories 
        ADD COLUMN storage_path TEXT;
        
        COMMENT ON COLUMN stories.storage_path IS 
        'Relative path in Bunny.net storage (e.g., stories/12345_abc.jpg) for automated deletion';
    END IF;
END $$;

-- Add media_url column if not exists (for public CDN URL)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stories' 
        AND column_name = 'media_url'
    ) THEN
        ALTER TABLE stories 
        ADD COLUMN media_url TEXT;
        
        COMMENT ON COLUMN stories.media_url IS 
        'Public CDN URL for displaying the story media';
    END IF;
END $$;

-- Add expires_at column if not exists (24 hours expiration)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stories' 
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE stories 
        ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours');
        
        COMMENT ON COLUMN stories.expires_at IS 
        'Timestamp when the story expires (24 hours from creation)';
        
        -- Create index for efficient cleanup queries
        CREATE INDEX idx_stories_expires_at ON stories(expires_at);
    END IF;
END $$;

-- Add caption column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stories' 
        AND column_name = 'caption'
    ) THEN
        ALTER TABLE stories 
        ADD COLUMN caption TEXT;
    END IF;
END $$;

-- Add media_type column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stories' 
        AND column_name = 'media_type'
    ) THEN
        ALTER TABLE stories 
        ADD COLUMN media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video'));
    END IF;
END $$;

-- =============================================
-- PART 2: Update Posts Table (if exists)
-- =============================================

-- Check if posts table exists and add media_url column
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'posts'
    ) THEN
        -- Add media_url column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'posts' 
            AND column_name = 'media_url'
        ) THEN
            ALTER TABLE posts 
            ADD COLUMN media_url TEXT;
            
            COMMENT ON COLUMN posts.media_url IS 
            'Public CDN URL for the post media (from Bunny.net)';
        END IF;
    END IF;
END $$;

-- =============================================
-- PART 3: Enable pg_cron Extension
-- =============================================

-- Enable pg_cron extension for scheduled tasks
-- Note: This requires superuser privileges or may need to be done via Supabase Dashboard
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verify pg_cron is enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        RAISE WARNING 'pg_cron extension is not available. Please enable it in Supabase Dashboard under Database > Extensions.';
    ELSE
        RAISE NOTICE 'pg_cron extension is enabled.';
    END IF;
END $$;

-- =============================================
-- PART 4: Schedule Cleanup Job (Every Hour)
-- =============================================

-- Remove existing job if it exists (to avoid duplicates)
DO $$
BEGIN
    PERFORM cron.unschedule('delete-expired-stories-hourly');
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'Job delete-expired-stories-hourly does not exist, skipping unschedule.';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not unschedule job: %', SQLERRM;
END $$;

-- Schedule the cleanup job to run every hour
-- This calls the Supabase Edge Function via HTTP POST
-- Uses private.keys table for secure authentication
SELECT cron.schedule(
    'delete-expired-stories-hourly',          -- Job name
    '0 * * * *',                              -- Cron expression: Every hour at minute 0
    $$
    SELECT
        net.http_post(
            url := 'https://gserzaenfrmrqoffzcxr.supabase.co/functions/v1/delete-expired-stories',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || (SELECT secret_value FROM private.keys WHERE key_name = 'service_role_key')
            ),
            body := '{}'::jsonb
        ) AS request_id;
    $$
);

-- =============================================
-- PART 5: Helper Functions
-- =============================================

-- Function to manually trigger cleanup (for testing)
-- Uses private.keys table for authentication
CREATE OR REPLACE FUNCTION trigger_story_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_service_key TEXT;
BEGIN
    -- Retrieve service role key from private table
    SELECT secret_value INTO v_service_key
    FROM private.keys
    WHERE key_name = 'service_role_key';
    
    IF v_service_key IS NULL THEN
        RAISE EXCEPTION 'Service role key not found in private.keys table';
    END IF;
    
    PERFORM net.http_post(
        url := 'https://gserzaenfrmrqoffzcxr.supabase.co/functions/v1/delete-expired-stories',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_key
        ),
        body := '{}'::jsonb
    );
END;
$$;

COMMENT ON FUNCTION trigger_story_cleanup() IS 
'Manually trigger the expired stories cleanup. Usage: SELECT trigger_story_cleanup();';

-- Function to view upcoming expired stories
CREATE OR REPLACE FUNCTION get_expiring_stories(hours_ahead INTEGER DEFAULT 24)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    storage_path TEXT,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    hours_until_expiry DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        id,
        user_id,
        storage_path,
        media_url,
        created_at,
        expires_at,
        EXTRACT(EPOCH FROM (expires_at - NOW())) / 3600 AS hours_until_expiry
    FROM stories
    WHERE expires_at <= NOW() + (hours_ahead || ' hours')::INTERVAL
    ORDER BY expires_at ASC;
$$;

COMMENT ON FUNCTION get_expiring_stories(INTEGER) IS 
'View stories that will expire within the specified hours. Usage: SELECT * FROM get_expiring_stories(24);';

-- Function to view expired stories (not yet cleaned up)
CREATE OR REPLACE FUNCTION get_expired_stories()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    storage_path TEXT,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    hours_since_expiry DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        id,
        user_id,
        storage_path,
        media_url,
        created_at,
        expires_at,
        EXTRACT(EPOCH FROM (NOW() - expires_at)) / 3600 AS hours_since_expiry
    FROM stories
    WHERE expires_at < NOW()
    ORDER BY expires_at ASC;
$$;

COMMENT ON FUNCTION get_expired_stories() IS 
'View stories that are already expired but not yet cleaned up. Usage: SELECT * FROM get_expired_stories();';

-- =============================================
-- PART 6: Private Secrets Storage
-- =============================================

-- Create private schema for secure key storage
CREATE SCHEMA IF NOT EXISTS private;

-- Revoke access from anon and authenticated roles (security)
REVOKE ALL ON SCHEMA private FROM anon, authenticated, public;

-- Create secure keys table
CREATE TABLE IF NOT EXISTS private.keys (
    key_name TEXT PRIMARY KEY,
    secret_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revoke access from public roles
REVOKE ALL ON TABLE private.keys FROM anon, authenticated, public;

-- Only postgres (service role) can access this table
GRANT ALL ON TABLE private.keys TO postgres;

COMMENT ON SCHEMA private IS 'Private schema for storing sensitive keys, not accessible by anon or authenticated roles';
COMMENT ON TABLE private.keys IS 'Secure storage for API keys and secrets used by cron jobs and functions';

-- Insert the secrets (safe from client access)
INSERT INTO private.keys (key_name, secret_value)
VALUES 
    ('service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZXJ6YWVuZnJtcnFvZmZ6Y3hyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjExNzc5OSwiZXhwIjoyMDcxNjkzNzk5fQ.odO_-TqCDpliDv-TplUokm08gfoZARABo62vCTDRWCw'),
    ('bunny_api_key', 'a9ce5ca7-27cd-4358-8b8075ed96eb-a794-4d87')
ON CONFLICT (key_name) 
DO UPDATE SET 
    secret_value = EXCLUDED.secret_value,
    updated_at = NOW();

-- Verify secrets are stored
SELECT key_name, 
       LEFT(secret_value, 20) || '...' AS secret_preview,
       created_at
FROM private.keys
ORDER BY key_name;

-- =============================================
-- PART 8: Verification Queries
-- =============================================

-- Verify private schema and keys are set up
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'private';

-- Verify secrets are stored (preview only)
SELECT 
    key_name,
    LEFT(secret_value, 15) || '...' AS secret_preview,
    LENGTH(secret_value) AS key_length,
    created_at
FROM private.keys
ORDER BY key_name;

-- View all scheduled cron jobs
SELECT * FROM cron.job WHERE jobname = 'delete-expired-stories-hourly';

-- View cron job execution history (last 10 runs)
SELECT 
    jobid,
    runid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'delete-expired-stories-hourly')
ORDER BY start_time DESC
LIMIT 10;

-- =============================================
-- SETUP INSTRUCTIONS
-- =============================================

/*
✅ PROJECT CONFIGURATION COMPLETED:
   - Project URL: https://gserzaenfrmrqoffzcxr.supabase.co
   - Secrets stored in secure private.keys table
   - Service Role Key and Bunny API Key configured
   - All YOUR_PROJECT_REF placeholders replaced

🔐 SECURITY APPROACH:
   This script uses a private schema with a keys table to store secrets.
   - private.keys table is NOT accessible by anon or authenticated roles
   - Only postgres/service_role can read from this table
   - Cron jobs and functions retrieve keys via subqueries

1. ENABLE pg_cron EXTENSION:
   - Go to Supabase Dashboard > Database > Extensions
   - Search for 'pg_cron'
   - Click Enable

2. RUN THIS SQL SCRIPT:
   - Copy this entire file into Supabase SQL Editor
   - Click "RUN" to execute
   - The script will:
     ✓ Create private schema and keys table
     ✓ Insert service_role_key and bunny_api_key securely
     ✓ Add columns to stories table (storage_path, expires_at, etc.)
     ✓ Schedule hourly cleanup cron job
     ✓ Create helper functions

3. VERIFY SETUP:
   After running, you should see:
   - private.keys table with 2 rows (keys are hidden from clients)
   - Scheduled cron job: delete-expired-stories-hourly
   - Helper functions: trigger_story_cleanup(), get_expired_stories(), etc.

4. DEPLOY EDGE FUNCTION:
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link your project
   supabase link --project-ref gserzaenfrmrqoffzcxr
   
   # Deploy the cleanup function
   supabase functions deploy delete-expired-stories
   
   # Set environment secrets for Edge Function
   supabase secrets set BUNNY_STORAGE_NAME=nomad-app-media
   supabase secrets set BUNNY_ACCESS_KEY=a9ce5ca7-27cd-4358-8b8075ed96eb-a794-4d87
   supabase secrets set BUNNY_HOSTNAME=sg.storage.bunnycdn.com
   ```

5. TEST THE CLEANUP:
   ```sql
   -- Manually trigger cleanup (in SQL Editor)
   SELECT trigger_story_cleanup();
   
   -- Check execution result
   SELECT * FROM cron.job_run_details 
   ORDER BY start_time DESC 
   LIMIT 5;
   ```

6. MONITOR:
   ```sql
   -- View expired stories waiting for cleanup
   SELECT * FROM get_expired_stories();
   
   -- View stories expiring in next 24 hours
   SELECT * FROM get_expiring_stories(24);
   
   -- Check cron job status
   SELECT * FROM cron.job WHERE jobname = 'delete-expired-stories-hourly';
   
   -- View recent cron executions
   SELECT * FROM cron.job_run_details 
   ORDER BY start_time DESC 
   LIMIT 10;
   ```

7. UPDATE KEYS (IF NEEDED):
   ```sql
   -- Update service role key
   UPDATE private.keys 
   SET secret_value = 'new-key-here', updated_at = NOW()
   WHERE key_name = 'service_role_key';
   
   -- Update Bunny API key
   UPDATE private.keys 
   SET secret_value = 'new-key-here', updated_at = NOW()
   WHERE key_name = 'bunny_api_key';
   ```

*/
