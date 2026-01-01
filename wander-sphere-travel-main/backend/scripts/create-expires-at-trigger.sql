-- Create trigger for expires_at to default to 24 hours after creation
-- This ensures stories automatically expire after 24 hours

-- Function to set expires_at to 24 hours after created_at on insert
CREATE OR REPLACE FUNCTION set_story_expires_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Set expires_at to 24 hours after created_at (or current time if created_at is not set)
    IF NEW.expires_at IS NULL THEN
        IF NEW.created_at IS NOT NULL THEN
            NEW.expires_at := NEW.created_at + INTERVAL '24 hours';
        ELSE
            NEW.expires_at := NOW() + INTERVAL '24 hours';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically set expires_at on story insertion
CREATE TRIGGER trigger_set_story_expires_at
    BEFORE INSERT ON public.stories
    FOR EACH ROW
    EXECUTE FUNCTION set_story_expires_at();