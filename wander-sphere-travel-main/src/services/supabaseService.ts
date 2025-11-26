/**
 * Supabase Service Layer
 * Direct database operations with proper authentication and foreign key handling
 */

import { supabase } from '@/config/supabase';
import type {
  DatabaseUser,
  DatabaseTrip,
  DatabaseJourney,
  DatabaseStory,
  InsertTrip,
  InsertJourney,
  InsertStory,
  UpdateTrip,
  UpdateJourney,
  UpdateStory,
} from '@/types/database';

/**
 * Get the current authenticated user ID
 * Throws an error if not authenticated
 */
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Not authenticated. Please log in to continue.');
  }
  
  return user.id;
}

/**
 * Check if user is authenticated
 */
async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

// =============================================
// USER OPERATIONS
// =============================================

export const userService = {
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<DatabaseUser | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return data as DatabaseUser;
  },

  /**
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<DatabaseUser | null> {
    const userId = await getCurrentUserId();
    return this.getUserProfile(userId);
  },

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<DatabaseUser>): Promise<DatabaseUser> {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return data as DatabaseUser;
  },

  /**
   * Update user preferences (currency, etc.)
   */
  async updateUserPreferences(preferences: { currency?: string }): Promise<DatabaseUser> {
    const userId = await getCurrentUserId();
    
    // Get current user to merge preferences
    const currentUser = await this.getUserProfile(userId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    const currentPreferences = (currentUser.preferences || {}) as any;
    const updatedPreferences = { ...currentPreferences, ...preferences };

    const { data, error } = await supabase
      .from('users')
      .update({ preferences: updatedPreferences })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update preferences: ${error.message}`);
    }

    return data as DatabaseUser;
  },

  /**
   * Get user currency preference
   */
  async getUserCurrency(): Promise<string> {
    try {
      const user = await this.getCurrentUserProfile();
      if (user?.preferences?.currency) {
        return user.preferences.currency;
      }
      return 'USD'; // Default
    } catch (error) {
      console.error('Error getting user currency:', error);
      return 'USD'; // Default on error
    }
  },
};

// =============================================
// TRIP OPERATIONS
// =============================================

export const tripService = {
  /**
   * Get all trips for the current user
   */
  async getMyTrips(): Promise<DatabaseTrip[]> {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch trips: ${error.message}`);
    }

    return data as DatabaseTrip[];
  },

  /**
   * Get trip by ID
   */
  async getTripById(tripId: string): Promise<DatabaseTrip | null> {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Trip not found
      }
      throw new Error(`Failed to fetch trip: ${error.message}`);
    }

    return data as DatabaseTrip;
  },

  /**
   * Get public trips
   */
  async getPublicTrips(limit: number = 20): Promise<DatabaseTrip[]> {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('visibility', 'public')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch public trips: ${error.message}`);
    }

    return data as DatabaseTrip[];
  },

  /**
   * Create a new trip
   * Automatically sets user_id from the current authenticated user
   */
  async createTrip(tripData: InsertTrip): Promise<DatabaseTrip> {
    const userId = await getCurrentUserId();

    // Ensure user_id is set
    const tripInsert = {
      ...tripData,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('trips')
      .insert(tripInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create trip: ${error.message}`);
    }

    return data as DatabaseTrip;
  },

  /**
   * Update a trip
   * Only the owner can update
   */
  async updateTrip(tripId: string, updates: UpdateTrip): Promise<DatabaseTrip> {
    const userId = await getCurrentUserId();

    // Verify ownership
    const trip = await this.getTripById(tripId);
    if (!trip || trip.user_id !== userId) {
      throw new Error('You do not have permission to update this trip');
    }

    const { data, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', tripId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update trip: ${error.message}`);
    }

    return data as DatabaseTrip;
  },

  /**
   * Delete a trip
   * Only the owner can delete
   */
  async deleteTrip(tripId: string): Promise<void> {
    const userId = await getCurrentUserId();

    // Verify ownership
    const trip = await this.getTripById(tripId);
    if (!trip || trip.user_id !== userId) {
      throw new Error('You do not have permission to delete this trip');
    }

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (error) {
      throw new Error(`Failed to delete trip: ${error.message}`);
    }
  },
};

// =============================================
// JOURNEY OPERATIONS
// =============================================

export const journeyService = {
  /**
   * Get all journeys for the current user
   */
  async getMyJourneys(tripId?: string): Promise<DatabaseJourney[]> {
    const userId = await getCurrentUserId();
    
    let query = supabase
      .from('journeys')
      .select('*')
      .eq('user_id', userId);

    if (tripId) {
      query = query.eq('trip_id', tripId);
    }

    const { data, error } = await query.order('journey_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch journeys: ${error.message}`);
    }

    return data as DatabaseJourney[];
  },

  /**
   * Get public journeys
   */
  async getPublicJourneys(limit: number = 20): Promise<DatabaseJourney[]> {
    const { data, error } = await supabase
      .from('journeys')
      .select('*')
      .eq('is_public', true)
      .order('journey_date', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch public journeys: ${error.message}`);
    }

    return data as DatabaseJourney[];
  },

  /**
   * Get journey by ID
   */
  async getJourneyById(journeyId: string): Promise<DatabaseJourney | null> {
    const { data, error } = await supabase
      .from('journeys')
      .select('*')
      .eq('id', journeyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Journey not found
      }
      throw new Error(`Failed to fetch journey: ${error.message}`);
    }

    return data as DatabaseJourney;
  },

  /**
   * Get journeys for a specific trip
   */
  async getJourneysByTripId(tripId: string): Promise<DatabaseJourney[]> {
    const { data, error } = await supabase
      .from('journeys')
      .select('*')
      .eq('trip_id', tripId)
      .order('journey_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch journeys: ${error.message}`);
    }

    return data as DatabaseJourney[];
  },

  /**
   * Create a new journey
   * Automatically sets user_id from the current authenticated user
   * MUST include trip_id if the journey belongs to a trip
   */
  async createJourney(journeyData: InsertJourney): Promise<DatabaseJourney> {
    const userId = await getCurrentUserId();

    // Ensure user_id is set
    const journeyInsert = {
      ...journeyData,
      user_id: userId,
    };

    // If trip_id is provided, verify the trip exists and belongs to the user
    if (journeyInsert.trip_id) {
      const trip = await tripService.getTripById(journeyInsert.trip_id);
      if (!trip) {
        throw new Error('Trip not found');
      }
      if (trip.user_id !== userId) {
        throw new Error('You do not have permission to add journeys to this trip');
      }
    }

    const { data, error } = await supabase
      .from('journeys')
      .insert(journeyInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create journey: ${error.message}`);
    }

    return data as DatabaseJourney;
  },

  /**
   * Update a journey
   * Only the owner can update
   */
  async updateJourney(journeyId: string, updates: UpdateJourney): Promise<DatabaseJourney> {
    const userId = await getCurrentUserId();

    // Verify ownership
    const journey = await this.getJourneyById(journeyId);
    if (!journey || journey.user_id !== userId) {
      throw new Error('You do not have permission to update this journey');
    }

    const { data, error } = await supabase
      .from('journeys')
      .update(updates)
      .eq('id', journeyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update journey: ${error.message}`);
    }

    return data as DatabaseJourney;
  },

  /**
   * Delete a journey
   * Only the owner can delete
   */
  async deleteJourney(journeyId: string): Promise<void> {
    const userId = await getCurrentUserId();

    // Verify ownership
    const journey = await this.getJourneyById(journeyId);
    if (!journey || journey.user_id !== userId) {
      throw new Error('You do not have permission to delete this journey');
    }

    const { error } = await supabase
      .from('journeys')
      .delete()
      .eq('id', journeyId);

    if (error) {
      throw new Error(`Failed to delete journey: ${error.message}`);
    }
  },
};

// =============================================
// STORY OPERATIONS
// =============================================

export const storyService = {
  /**
   * Get all stories for the current user
   */
  async getMyStories(tripId?: string): Promise<DatabaseStory[]> {
    const userId = await getCurrentUserId();
    
    let query = supabase
      .from('stories')
      .select('*')
      .eq('user_id', userId);

    if (tripId) {
      query = query.eq('trip_id', tripId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch stories: ${error.message}`);
    }

    return data as DatabaseStory[];
  },

  /**
   * Get public stories
   */
  async getPublicStories(limit: number = 20): Promise<DatabaseStory[]> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('is_public', true)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch public stories: ${error.message}`);
    }

    return data as DatabaseStory[];
  },

  /**
   * Get story by ID
   */
  async getStoryById(storyId: string): Promise<DatabaseStory | null> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Story not found
      }
      throw new Error(`Failed to fetch story: ${error.message}`);
    }

    return data as DatabaseStory;
  },

  /**
   * Get stories for a specific trip
   */
  async getStoriesByTripId(tripId: string): Promise<DatabaseStory[]> {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch stories: ${error.message}`);
    }

    return data as DatabaseStory[];
  },

  /**
   * Create a new story
   * Automatically sets user_id from the current authenticated user
   * MUST include trip_id if the story belongs to a trip
   */
  async createStory(storyData: InsertStory): Promise<DatabaseStory> {
    const userId = await getCurrentUserId();

    // Ensure user_id is set
    const storyInsert = {
      ...storyData,
      user_id: userId,
      likes_count: 0,
      views_count: 0,
    };

    // If trip_id is provided, verify the trip exists and belongs to the user
    if (storyInsert.trip_id) {
      const trip = await tripService.getTripById(storyInsert.trip_id);
      if (!trip) {
        throw new Error('Trip not found');
      }
      if (trip.user_id !== userId) {
        throw new Error('You do not have permission to add stories to this trip');
      }
    }

    const { data, error } = await supabase
      .from('stories')
      .insert(storyInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create story: ${error.message}`);
    }

    return data as DatabaseStory;
  },

  /**
   * Update a story
   * Only the owner can update
   */
  async updateStory(storyId: string, updates: UpdateStory): Promise<DatabaseStory> {
    const userId = await getCurrentUserId();

    // Verify ownership
    const story = await this.getStoryById(storyId);
    if (!story || story.user_id !== userId) {
      throw new Error('You do not have permission to update this story');
    }

    const { data, error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', storyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update story: ${error.message}`);
    }

    return data as DatabaseStory;
  },

  /**
   * Delete a story
   * Only the owner can delete
   */
  async deleteStory(storyId: string): Promise<void> {
    const userId = await getCurrentUserId();

    // Verify ownership
    const story = await this.getStoryById(storyId);
    if (!story || story.user_id !== userId) {
      throw new Error('You do not have permission to delete this story');
    }

    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);

    if (error) {
      throw new Error(`Failed to delete story: ${error.message}`);
    }
  },
};

// =============================================
// EXPORT ALL SERVICES
// =============================================

export default {
  userService,
  tripService,
  journeyService,
  storyService,
  isAuthenticated,
  getCurrentUserId,
};

