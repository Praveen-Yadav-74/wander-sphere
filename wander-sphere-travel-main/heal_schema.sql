-- 1. Fix TRIPS Table (Missing Category)
ALTER TABLE "public"."trips" ADD COLUMN IF NOT EXISTS "category" text DEFAULT 'adventure';

-- 2. Fix STORIES Table (Ensure correct structure)
CREATE TABLE IF NOT EXISTS "public"."stories" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "media_url" text NOT NULL,
    "media_type" text DEFAULT 'image',
    "caption" text,
    "created_at" timesptamp with time zone DEFAULT now(),
    "expires_at" timestamp with time zone DEFAULT (now() + interval '24 hours'),
    "views_count" integer DEFAULT 0
);

-- Ensure columns exist if table already exists
ALTER TABLE "public"."stories" ADD COLUMN IF NOT EXISTS "media_url" text;
ALTER TABLE "public"."stories" ADD COLUMN IF NOT EXISTS "media_type" text;
ALTER TABLE "public"."stories" ADD COLUMN IF NOT EXISTS "views_count" integer DEFAULT 0;

-- 3. Fix CLUBS Table (Ensure image_url)
CREATE TABLE IF NOT EXISTS "public"."clubs" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "name" text NOT NULL,
    "description" text,
    "image_url" text,
    "creator_id" uuid REFERENCES "public"."users"("id"),
    "created_at" timestamp with time zone DEFAULT now()
);

-- Ensure column exists if table already exists
ALTER TABLE "public"."clubs" ADD COLUMN IF NOT EXISTS "image_url" text;
