-- =============================================
-- FRESH DATABASE SETUP FOR WANDER SPHERE TRAVEL
-- =============================================
-- This script creates a complete fresh database setup
-- Run this in Supabase SQL Editor to start clean

-- =============================================
-- STEP 1: Drop existing tables (if any)
-- =============================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.trip_participants CASCADE;
DROP TABLE IF EXISTS public.trip_comment_likes CASCADE;
DROP TABLE IF EXISTS public.trip_comments CASCADE;
DROP TABLE IF EXISTS public.trip_likes CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.journeys CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.clubs CASCADE;
DROP TABLE IF EXISTS public.user_relationships CASCADE;
DROP TABLE IF EXISTS public.blocked_users CASCADE;
DROP TABLE IF EXISTS public.refresh_tokens CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =============================================
-- STEP 2: Create Users Table
-- =============================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    location JSONB, -- {city, country, coordinates}
    preferences JSONB, -- travel preferences, interests
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    privacy_settings JSONB DEFAULT '{"profile_visibility": "public", "location_sharing": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 3: Create Trips Table
-- =============================================

CREATE TABLE public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    destination JSONB NOT NULL, -- {city, country, coordinates, address}
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
    budget JSONB, -- {total, currency, breakdown}
    max_participants INTEGER DEFAULT 1,
    current_participants INTEGER DEFAULT 1,
    trip_type VARCHAR(50), -- solo, group, family, adventure, etc.
    difficulty_level VARCHAR(20), -- easy, moderate, hard
    tags TEXT[], -- array of tags
    itinerary JSONB, -- detailed day-by-day plan
    images TEXT[], -- array of image URLs
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'friends')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 4: Create Budgets Table
-- =============================================

CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    categories JSONB, -- {accommodation, transport, food, activities, etc.}
    expenses JSONB, -- array of expense records
    remaining_amount DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'exceeded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 5: Create Journeys Table
-- =============================================

CREATE TABLE public.journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    journey_date DATE NOT NULL,
    location JSONB, -- current location details
    activities JSONB, -- what was done
    photos TEXT[], -- array of photo URLs
    notes TEXT,
    mood VARCHAR(20), -- happy, excited, tired, etc.
    weather JSONB, -- weather conditions
    expenses JSONB, -- expenses for this journey
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 6: Create Stories Table
-- =============================================

CREATE TABLE public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    featured_image TEXT,
    images TEXT[], -- array of image URLs
    tags TEXT[],
    location JSONB,
    reading_time INTEGER, -- estimated reading time in minutes
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 7: Create Clubs Table
-- =============================================

CREATE TABLE public.clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    club_type VARCHAR(50), -- travel, adventure, photography, etc.
    location JSONB, -- club location/region
    cover_image TEXT,
    member_count INTEGER DEFAULT 1,
    max_members INTEGER,
    rules TEXT,
    tags TEXT[],
    is_public BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 8: Create Notifications Table
-- =============================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- trip_invite, friend_request, story_like, etc.
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- additional notification data
    is_read BOOLEAN DEFAULT false,
    action_url TEXT, -- URL to navigate when clicked
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 9: Create Relationship Tables
-- =============================================

-- Trip Participants
CREATE TABLE public.trip_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('organizer', 'participant', 'invited')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'removed')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);

-- Trip Comments
CREATE TABLE public.trip_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.trip_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trip Likes
CREATE TABLE public.trip_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);

-- Trip Comment Likes
CREATE TABLE public.trip_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.trip_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- User Relationships (Friends/Following)
CREATE TABLE public.user_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Blocked Users
CREATE TABLE public.blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

-- Refresh Tokens
CREATE TABLE public.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 10: Create Indexes for Performance
-- =============================================

-- Users indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_active ON public.users(is_active);

-- Trips indexes
CREATE INDEX idx_trips_user_id ON public.trips(user_id);
CREATE INDEX idx_trips_destination ON public.trips USING GIN(destination);
CREATE INDEX idx_trips_start_date ON public.trips(start_date);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trips_visibility ON public.trips(visibility);
CREATE INDEX idx_trips_tags ON public.trips USING GIN(tags);

-- Budgets indexes
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_trip_id ON public.budgets(trip_id);

-- Journeys indexes
CREATE INDEX idx_journeys_user_id ON public.journeys(user_id);
CREATE INDEX idx_journeys_trip_id ON public.journeys(trip_id);
CREATE INDEX idx_journeys_date ON public.journeys(journey_date);

-- Stories indexes
CREATE INDEX idx_stories_user_id ON public.stories(user_id);
CREATE INDEX idx_stories_trip_id ON public.stories(trip_id);
CREATE INDEX idx_stories_public ON public.stories(is_public);
CREATE INDEX idx_stories_featured ON public.stories(is_featured);
CREATE INDEX idx_stories_tags ON public.stories USING GIN(tags);

-- Clubs indexes
CREATE INDEX idx_clubs_created_by ON public.clubs(created_by);
CREATE INDEX idx_clubs_type ON public.clubs(club_type);
CREATE INDEX idx_clubs_public ON public.clubs(is_public);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created ON public.notifications(created_at);

-- Relationship indexes
CREATE INDEX idx_trip_participants_trip ON public.trip_participants(trip_id);
CREATE INDEX idx_trip_participants_user ON public.trip_participants(user_id);
CREATE INDEX idx_trip_comments_trip ON public.trip_comments(trip_id);
CREATE INDEX idx_trip_comments_user ON public.trip_comments(user_id);
CREATE INDEX idx_trip_likes_trip ON public.trip_likes(trip_id);
CREATE INDEX idx_trip_likes_user ON public.trip_likes(user_id);
CREATE INDEX idx_trip_comment_likes_comment ON public.trip_comment_likes(comment_id);
CREATE INDEX idx_trip_comment_likes_user ON public.trip_comment_likes(user_id);
CREATE INDEX idx_user_relationships_follower ON public.user_relationships(follower_id);
CREATE INDEX idx_user_relationships_following ON public.user_relationships(following_id);
CREATE INDEX idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON public.blocked_users(blocked_id);
CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON public.refresh_tokens(expires_at);

-- =============================================
-- STEP 11: Create Update Triggers
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journeys_updated_at BEFORE UPDATE ON public.journeys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trip_comments_updated_at BEFORE UPDATE ON public.trip_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATABASE SETUP COMPLETE
-- =============================================

-- All tables have been created with proper relationships
-- Indexes have been added for optimal performance
-- Triggers are in place for automatic timestamp updates
-- Ready for RLS policies to be applied