-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar TEXT DEFAULT '',
  bio TEXT DEFAULT '' CHECK (LENGTH(bio) <= 500),
  location TEXT DEFAULT '',
  date_of_birth DATE,
  phone VARCHAR(20) DEFAULT '',
  is_email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token TEXT,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP,
  
  -- Preferences as JSONB
  preferences JSONB DEFAULT '{
    "travelStyle": "mid-range",
    "interests": [],
    "notifications": {
      "email": true,
      "push": true,
      "tripUpdates": true,
      "socialActivity": true
    },
    "privacy": {
      "profileVisibility": "public",
      "showEmail": false,
      "showPhone": false
    }
  }'::jsonb,
  
  -- Stats as JSONB
  stats JSONB DEFAULT '{
    "tripsCompleted": 0,
    "countriesVisited": 0,
    "totalDistance": 0,
    "totalSpent": 0
  }'::jsonb,
  
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  lock_until TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

-- User relationships table (followers/following)
CREATE TABLE user_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Blocked users table
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL CHECK (LENGTH(description) <= 2000),
  
  -- Destination as JSONB
  destination JSONB NOT NULL,
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration INTEGER NOT NULL,
  
  -- Budget as JSONB
  budget JSONB NOT NULL DEFAULT '{
    "total": 0,
    "currency": "USD",
    "breakdown": {
      "accommodation": 0,
      "transportation": 0,
      "food": 0,
      "activities": 0,
      "shopping": 0,
      "miscellaneous": 0
    },
    "spent": 0
  }'::jsonb,
  
  organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  max_participants INTEGER NOT NULL CHECK (max_participants >= 1 AND max_participants <= 50),
  
  -- Itinerary as JSONB array
  itinerary JSONB DEFAULT '[]'::jsonb,
  
  -- Images as JSONB array
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Tags as array
  tags TEXT[] DEFAULT '{}',
  
  category VARCHAR(20) NOT NULL CHECK (category IN ('adventure', 'relaxation', 'cultural', 'business', 'family', 'romantic', 'solo', 'group')),
  difficulty VARCHAR(20) DEFAULT 'easy' CHECK (difficulty IN ('easy', 'moderate', 'challenging', 'extreme')),
  status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'ongoing', 'completed', 'cancelled')),
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
  
  -- Requirements as JSONB
  requirements JSONB DEFAULT '{
    "ageRestriction": {
      "min": 0,
      "max": 100
    },
    "fitnessLevel": "low",
    "specialRequirements": []
  }'::jsonb,
  
  -- Social stats
  shares INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trip participants table
CREATE TABLE trip_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('organizer', 'co-organizer', 'participant')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- Trip likes table
CREATE TABLE trip_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- Trip comments table
CREATE TABLE trip_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trip comment likes table
CREATE TABLE trip_comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES trip_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_user_relationships_follower ON user_relationships(follower_id);
CREATE INDEX idx_user_relationships_following ON user_relationships(following_id);
CREATE INDEX idx_trips_organizer ON trips(organizer_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_category ON trips(category);
CREATE INDEX idx_trips_dates ON trips(start_date, end_date);
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX idx_trips_featured ON trips(featured, created_at DESC);
CREATE INDEX idx_trip_participants_trip ON trip_participants(trip_id);
CREATE INDEX idx_trip_participants_user ON trip_participants(user_id);
CREATE INDEX idx_trip_likes_trip ON trip_likes(trip_id);
CREATE INDEX idx_trip_comments_trip ON trip_comments(trip_id);

-- Create GIN index for JSONB fields
CREATE INDEX idx_users_preferences ON users USING GIN (preferences);
CREATE INDEX idx_users_stats ON users USING GIN (stats);
CREATE INDEX idx_trips_destination ON trips USING GIN (destination);
CREATE INDEX idx_trips_budget ON trips USING GIN (budget);
CREATE INDEX idx_trips_tags ON trips USING GIN (tags);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_comments_updated_at BEFORE UPDATE ON trip_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic examples - can be customized based on requirements)
CREATE POLICY "Users can view public profiles" ON users
    FOR SELECT USING (is_active = true AND (preferences->'privacy'->>'profileVisibility' = 'public' OR auth.uid() = id));

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view public trips" ON trips
    FOR SELECT USING (is_active = true AND (visibility = 'public' OR organizer_id = auth.uid()));

CREATE POLICY "Users can create trips" ON trips
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their trips" ON trips
    FOR UPDATE USING (auth.uid() = organizer_id);