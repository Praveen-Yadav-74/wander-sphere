/**
 * Database Type Definitions
 * These types match the Supabase database schema exactly
 */

// =============================================
// USERS TABLE
// =============================================

export interface DatabaseUser {
  id: string; // UUID
  email: string;
  first_name: string;
  last_name: string;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  phone?: string | null;
  date_of_birth?: string | null; // DATE
  gender?: string | null;
  location?: LocationData | null; // JSONB
  preferences?: UserPreferences | null; // JSONB
  role?: 'user' | 'admin' | 'moderator';
  is_active?: boolean;
  is_verified?: boolean;
  privacy_settings?: PrivacySettings | null; // JSONB
  created_at: string; // TIMESTAMP WITH TIME ZONE
  updated_at: string; // TIMESTAMP WITH TIME ZONE
}

export interface LocationData {
  city?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
}

export interface UserPreferences {
  language?: string;
  currency?: string;
  timezone?: string;
  travelStyle?: string;
  interests?: string[];
  budgetRange?: {
    min: number;
    max: number;
  };
}

export interface PrivacySettings {
  profile_visibility?: 'public' | 'private' | 'friends';
  location_sharing?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
}

// =============================================
// TRIPS TABLE
// =============================================

export interface DatabaseTrip {
  id: string; // UUID
  user_id: string; // UUID -> references users(id)
  title: string;
  description?: string | null;
  destination: DestinationData; // JSONB - required
  start_date: string; // DATE
  end_date: string; // DATE
  duration?: number; // GENERATED - days
  budget?: BudgetData | null; // JSONB
  max_participants?: number;
  current_participants?: number;
  trip_type?: string | null; // solo, group, family, adventure, etc.
  difficulty_level?: string | null; // easy, moderate, hard
  tags?: string[] | null; // TEXT[]
  itinerary?: ItineraryData[] | null; // JSONB
  images?: string[] | null; // TEXT[]
  status?: 'planning' | 'active' | 'completed' | 'cancelled';
  visibility?: 'public' | 'private' | 'friends';
  is_active?: boolean;
  created_at: string; // TIMESTAMP WITH TIME ZONE
  updated_at: string; // TIMESTAMP WITH TIME ZONE
}

export interface DestinationData {
  city: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
}

export interface BudgetData {
  total: number;
  currency: string;
  breakdown?: {
    accommodation?: number;
    transport?: number;
    food?: number;
    activities?: number;
    other?: number;
  };
}

export interface ItineraryData {
  day: number;
  title: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  activities?: string[];
}

// =============================================
// JOURNEYS TABLE
// =============================================

export interface DatabaseJourney {
  id: string; // UUID
  user_id: string; // UUID -> references users(id)
  trip_id?: string | null; // UUID -> references trips(id)
  title: string;
  description?: string | null;
  journey_date: string; // DATE
  location?: JourneyLocationData | null; // JSONB
  activities?: ActivityData[] | null; // JSONB
  photos?: string[] | null; // TEXT[]
  notes?: string | null;
  mood?: string | null; // happy, excited, tired, etc.
  weather?: WeatherData | null; // JSONB
  expenses?: ExpenseData[] | null; // JSONB
  is_public?: boolean;
  created_at: string; // TIMESTAMP WITH TIME ZONE
  updated_at: string; // TIMESTAMP WITH TIME ZONE
}

export interface JourneyLocationData {
  city?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  placeName?: string;
}

export interface ActivityData {
  name: string;
  description?: string;
  time?: string;
  location?: string;
  cost?: number;
}

export interface WeatherData {
  temperature?: number;
  condition?: string; // sunny, cloudy, rainy, etc.
  humidity?: number;
  windSpeed?: number;
  description?: string;
}

export interface ExpenseData {
  category: string;
  amount: number;
  currency: string;
  description?: string;
  date?: string;
}

// =============================================
// STORIES TABLE
// =============================================

export interface DatabaseStory {
  id: string; // UUID
  user_id: string; // UUID -> references users(id)
  trip_id?: string | null; // UUID -> references trips(id)
  title: string;
  content: string;
  summary?: string | null;
  featured_image?: string | null;
  images?: string[] | null; // TEXT[]
  tags?: string[] | null; // TEXT[]
  location?: StoryLocationData | null; // JSONB
  reading_time?: number | null; // minutes
  likes_count?: number;
  views_count?: number;
  is_public?: boolean;
  is_featured?: boolean;
  status?: 'draft' | 'published' | 'archived';
  created_at: string; // TIMESTAMP WITH TIME ZONE
  updated_at: string; // TIMESTAMP WITH TIME ZONE
}

export interface StoryLocationData {
  city?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  placeName?: string;
}

// =============================================
// NOTIFICATION SETTINGS TABLE
// =============================================

export interface DatabaseNotificationSettings {
  id: string; // UUID
  user_id: string; // UUID -> references users(id)
  email_notifications?: boolean;
  push_notifications?: boolean;
  trip_invites?: boolean;
  friend_requests?: boolean;
  story_likes?: boolean;
  comments?: boolean;
  budget_alerts?: boolean;
  journey_updates?: boolean;
  marketing_emails?: boolean;
  created_at: string; // TIMESTAMP WITH TIME ZONE
  updated_at: string; // TIMESTAMP WITH TIME ZONE
}

// =============================================
// INSERT/UPDATE TYPES (for creating/updating records)
// =============================================

export type InsertUser = Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; // Optional for inserts, will be set by trigger
};

export type InsertTrip = Omit<DatabaseTrip, 'id' | 'user_id' | 'duration' | 'created_at' | 'updated_at'> & {
  id?: string;
  user_id?: string; // Will be set from auth context
};

export type InsertJourney = Omit<DatabaseJourney, 'id' | 'user_id' | 'created_at' | 'updated_at'> & {
  id?: string;
  user_id?: string; // Will be set from auth context
  trip_id?: string | null;
};

export type InsertStory = Omit<DatabaseStory, 'id' | 'user_id' | 'likes_count' | 'views_count' | 'created_at' | 'updated_at'> & {
  id?: string;
  user_id?: string; // Will be set from auth context
  trip_id?: string | null;
};

export type UpdateUser = Partial<Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateTrip = Partial<Omit<DatabaseTrip, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type UpdateJourney = Partial<Omit<DatabaseJourney, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type UpdateStory = Partial<Omit<DatabaseStory, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

