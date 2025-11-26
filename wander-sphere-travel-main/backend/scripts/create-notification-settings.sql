-- Create notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    trip_invites BOOLEAN DEFAULT true,
    friend_requests BOOLEAN DEFAULT true,
    story_likes BOOLEAN DEFAULT true,
    comments BOOLEAN DEFAULT true,
    budget_alerts BOOLEAN DEFAULT true,
    journey_updates BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_notification_settings_updated_at 
    BEFORE UPDATE ON public.notification_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();