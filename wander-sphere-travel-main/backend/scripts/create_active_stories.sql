-- Create active_stories table for 24h ephemeral stories
CREATE TABLE IF NOT EXISTS public.active_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(20) DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    views_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true
);

-- Index for querying active stories
CREATE INDEX idx_active_stories_user_id ON public.active_stories(user_id);
CREATE INDEX idx_active_stories_expires_at ON public.active_stories(expires_at);

-- RLS Policies
ALTER TABLE public.active_stories ENABLE ROW LEVEL SECURITY;

-- Everyone can view active stories (that are public)
CREATE POLICY "Public active stories are viewable by everyone" 
ON public.active_stories FOR SELECT 
USING (expires_at > NOW());

-- Users can insert their own stories
CREATE POLICY "Users can insert their own active stories" 
ON public.active_stories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "Users can delete their own active stories" 
ON public.active_stories FOR DELETE 
USING (auth.uid() = user_id);
