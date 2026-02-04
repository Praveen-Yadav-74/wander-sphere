-- Delete the broken club to stop the 500 errors
DELETE FROM "public"."clubs" WHERE id = '1768163429977a6pocl0o8';

-- Check if current user has a valid profile
-- Note: Replace 'auth.uid()' with your actual User ID if running in a context where auth.uid() isn't available,
-- but in Supabase SQL Editor, auth.uid() usually works if you are impersonating or just checking the table generally.
-- Better yet, just select all profiles to see what's there.
SELECT * FROM "public"."profiles";
