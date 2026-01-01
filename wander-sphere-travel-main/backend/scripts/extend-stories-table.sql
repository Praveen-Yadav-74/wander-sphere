-- Extend public.stories table with media_url and expires_at columns
-- This enables 24-hour story functionality similar to Instagram Stories

-- Add media_url column for story media content
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Add expires_at column for story expiration
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update the updated_at trigger to include the new columns
-- We need to recreate the trigger function to handle all tables properly
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to the stories table if not already present
DROP TRIGGER IF EXISTS update_stories_updated_at ON public.stories;
CREATE TRIGGER update_stories_updated_at 
BEFORE UPDATE ON public.stories 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();