-- Fix clubs table: Add creator_id column if missing
ALTER TABLE "public"."clubs" ADD COLUMN IF NOT EXISTS "creator_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL;

-- Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clubs';
