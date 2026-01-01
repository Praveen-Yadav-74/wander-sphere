-- Add actor_id column to public.notifications table
-- This enables tracking the source user for likes/comments/follows/trip-interest

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.users(id);

-- Update the updated_at trigger for notifications table if needed
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to the notifications table if it doesn't exist
-- Note: notifications table might not have updated_at column in the original schema
-- so we might need to add it as well if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at 
BEFORE UPDATE ON public.notifications 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();