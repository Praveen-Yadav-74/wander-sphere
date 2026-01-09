-- ============================================================================
-- Bunny.net URL Diagnostic SQL Queries
-- Run these in Supabase SQL Editor to check what URLs are saved
-- ============================================================================

-- 1. Check recent posts/journeys media URLs
-- ============================================================================
SELECT 
    id,
    created_at,
    images,
    CASE 
        WHEN images::text LIKE '%storage.bunnycdn.com%' THEN '❌ WRONG: Using Storage URL'
        WHEN images::text LIKE '%b-cdn.net%' THEN '✅ CORRECT: Using CDN URL'
        WHEN images::text LIKE '%undefined%' THEN '❌ WRONG: Undefined in URL'
        WHEN images::text LIKE '%localhost%' THEN '❌ WRONG: Localhost in URL'
        ELSE '⚠️ UNKNOWN'
    END as url_status
FROM posts
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check stories media URLs
-- ============================================================================
SELECT 
    id,
    created_at,
    media_url,
    storage_path,
    CASE 
        WHEN media_url LIKE '%storage.bunnycdn.com%' THEN '❌ WRONG: Using Storage URL'
        WHEN media_url LIKE '%b-cdn.net%' THEN '✅ CORRECT: Using CDN URL'
        WHEN media_url LIKE '%undefined%' THEN '❌ WRONG: Undefined in URL'
        WHEN media_url LIKE '%localhost%' THEN '❌ WRONG: Localhost in URL'
        ELSE '⚠️ UNKNOWN'
    END as url_status
FROM stories
ORDER BY created_at DESC
LIMIT 10;

-- 3. Count URL types in posts
-- ============================================================================
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN images::text LIKE '%storage.bunnycdn.com%' THEN 1 END) as storage_url_count,
    COUNT(CASE WHEN images::text LIKE '%b-cdn.net%' THEN 1 END) as cdn_url_count,
    COUNT(CASE WHEN images::text LIKE '%undefined%' THEN 1 END) as undefined_count
FROM posts;

-- 4. Count URL types in stories
-- ============================================================================
SELECT 
    COUNT(*) as total_stories,
    COUNT(CASE WHEN media_url LIKE '%storage.bunnycdn.com%' THEN 1 END) as storage_url_count,
    COUNT(CASE WHEN media_url LIKE '%b-cdn.net%' THEN 1 END) as cdn_url_count,
    COUNT(CASE WHEN media_url LIKE '%undefined%' THEN 1 END) as undefined_count
FROM stories;

-- 5. Find all posts with WRONG URLs (Storage URL instead of CDN)
-- ============================================================================
SELECT 
    id,
    created_at,
    images,
    'Wrong URL detected' as issue
FROM posts
WHERE images::text LIKE '%storage.bunnycdn.com%'
ORDER BY created_at DESC;

-- 6. Find all stories with WRONG URLs
-- ============================================================================
SELECT 
    id,
    created_at,
    media_url,
    storage_path,
    'Wrong URL detected' as issue
FROM stories
WHERE media_url LIKE '%storage.bunnycdn.com%'
ORDER BY created_at DESC;

-- ============================================================================
-- FIX QUERIES (Run these ONLY if you find wrong URLs above)
-- ============================================================================

-- 7. FIX: Update posts with storage URLs to use CDN URLs
-- ⚠️ CAUTION: This will modify your data! Review query 5 results first
-- ============================================================================
-- Uncomment and run ONLY if you confirmed wrong URLs exist:
/*
UPDATE posts
SET images = REPLACE(
    images::text, 
    'https://sg.storage.bunnycdn.com/nomad-app-media/', 
    'https://nomad-app-media.b-cdn.net/'
)::jsonb
WHERE images::text LIKE '%storage.bunnycdn.com%';
*/

-- 8. FIX: Update stories with storage URLs to use CDN URLs
-- ⚠️ CAUTION: This will modify your data! Review query 6 results first
-- ============================================================================
-- Uncomment and run ONLY if you confirmed wrong URLs exist:
/*
UPDATE stories
SET media_url = REPLACE(
    media_url, 
    'https://sg.storage.bunnycdn.com/nomad-app-media/', 
    'https://nomad-app-media.b-cdn.net/'
)
WHERE media_url LIKE '%storage.bunnycdn.com%';
*/

-- ============================================================================
-- VERIFICATION QUERIES (Run after fix)
-- ============================================================================

-- 9. Verify fix was applied to posts
-- ============================================================================
/*
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN images::text LIKE '%storage.bunnycdn.com%' THEN 1 END) as still_broken,
    COUNT(CASE WHEN images::text LIKE '%b-cdn.net%' THEN 1 END) as fixed
FROM posts;
*/

-- 10. Verify fix was applied to stories
-- ============================================================================
/*
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN media_url LIKE '%storage.bunnycdn.com%' THEN 1 END) as still_broken,
    COUNT(CASE WHEN media_url LIKE '%b-cdn.net%' THEN 1 END) as fixed
FROM stories;
*/

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Run queries 1-6 first to DIAGNOSE the issue
-- 2. If you find wrong URLs, uncomment and run queries 7-8 to FIX them
-- 3. Run queries 9-10 to VERIFY the fix worked
-- 4. After fixing, restart your app and clear browser cache
-- ============================================================================
