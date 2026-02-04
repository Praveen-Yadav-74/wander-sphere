-- Create Club Members table if not exists
CREATE TABLE IF NOT EXISTS "public"."club_members" (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    "club_id" uuid REFERENCES "public"."clubs"("id") ON DELETE CASCADE,
    "user_id" uuid REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "role" text DEFAULT 'member', -- 'member', 'admin', 'organizer'
    "joined_at" timestamp with time zone DEFAULT now(),
    UNIQUE("club_id", "user_id")
);

-- Ensure public read access (if RLS is enabled, otherwise not strictly needed for basic functionality but good practice)
-- ALTER TABLE "public"."club_members" ENABLE ROW LEVEL SECURITY;

-- Note: We are reusing the 'posts' table with a 'club_id' column for club posts.
ALTER TABLE "public"."posts" ADD COLUMN IF NOT EXISTS "club_id" uuid REFERENCES "public"."clubs"("id") ON DELETE SET NULL;
