/**
 * Trip Service
 * Handles trip-related operations using Supabase directly
 */

import { tripService as supabaseTripService, userService as supabaseUserService } from './supabaseService';
import type { DatabaseTrip, InsertTrip } from '@/types/database';
import type { PaginatedResponse } from '@/config/api';

export interface Trip {
  id: string;
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: string;
  budget: string;
  maxParticipants: number;
  currentParticipants: number;
  organizer: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    bio?: string;
  };
  participants: TripParticipant[];
  images: string[];
  tags: string[];
  type: string;
  status: 'open' | 'full' | 'closed' | 'completed';
  meetingPoint?: string;
  requirements?: string[];
  itinerary?: TripItinerary[];
  createdAt: string;
  updatedAt: string;
}

export interface TripParticipant {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar?: string;
  role: 'organizer' | 'participant';
  joinedAt: string;
}

export interface TripItinerary {
  id: string;
  day: number;
  title: string;
  description: string;
  location?: string;
  startTime?: string;
  endTime?: string;
}

export interface TripComment {
  id: string;
  userId: string;
  user: {
    name: string;
    username: string;
    avatar?: string;
  };
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripData {
  title: string;
  description: string;
  destination: {
    country: string;
    city: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  dates: {
    startDate: string;
    endDate: string;
  };
  budget: {
    total: number;
    currency: string;
  };
  maxParticipants: number;
  category: string;
  difficulty?: string;
  visibility?: string;
  tags?: string[];
  images?: string[];
  itinerary?: any[];
  requirements?: string[];
}

export interface UpdateTripData extends Partial<CreateTripData> {
  id: string;
}

export interface TripSearchParams {
  query?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: string;
  type?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

/**
 * Transform DatabaseTrip to Trip interface
 */
async function transformDatabaseTripToTrip(dbTrip: DatabaseTrip): Promise<Trip> {
  // Get organizer info
  const organizer = await supabaseUserService.getUserProfile(dbTrip.user_id);
  
  return {
    id: dbTrip.id,
    title: dbTrip.title,
    description: dbTrip.description || '',
    destination: {
      country: dbTrip.destination.country,
      city: dbTrip.destination.city,
      coordinates: dbTrip.destination.coordinates,
    },
    dates: {
      startDate: dbTrip.start_date,
      endDate: dbTrip.end_date,
    },
    budget: {
      total: dbTrip.budget?.total || 0,
      currency: dbTrip.budget?.currency || 'USD',
    },
    maxParticipants: dbTrip.max_participants || 1,
    currentParticipants: dbTrip.current_participants || 1,
    organizer: {
      id: organizer?.id || dbTrip.user_id,
      name: organizer ? `${organizer.first_name} ${organizer.last_name}` : 'Unknown',
      username: organizer?.username || '',
      avatar: organizer?.avatar_url || undefined,
      bio: organizer?.bio || undefined,
    },
    participants: [], // TODO: Fetch from trip_participants table
    images: dbTrip.images || [],
    tags: dbTrip.tags || [],
    type: dbTrip.trip_type || '',
    status: mapTripStatus(dbTrip.status || 'planning'),
    requirements: [], // TODO: Extract from trip data if needed
    itinerary: dbTrip.itinerary || [],
    createdAt: dbTrip.created_at,
    updatedAt: dbTrip.updated_at,
  };
}

/**
 * Transform CreateTripData to InsertTrip
 */
function transformCreateTripDataToInsertTrip(tripData: CreateTripData): InsertTrip {
  return {
    title: tripData.title,
    description: tripData.description,
    destination: {
      city: tripData.destination.city,
      country: tripData.destination.country,
      coordinates: tripData.destination.coordinates,
    },
    start_date: tripData.dates.startDate,
    end_date: tripData.dates.endDate,
    budget: {
      total: tripData.budget.total,
      currency: tripData.budget.currency,
    },
    max_participants: tripData.maxParticipants,
    trip_type: tripData.category,
    difficulty_level: tripData.difficulty,
    visibility: (tripData.visibility as 'public' | 'private' | 'friends') || 'public',
    tags: tripData.tags,
    images: tripData.images,
    itinerary: tripData.itinerary,
    status: 'planning',
    is_active: true,
  };
}

/**
 * Map database status to Trip status
 */
function mapTripStatus(dbStatus: string): 'open' | 'full' | 'closed' | 'completed' {
  switch (dbStatus) {
    case 'active':
      return 'open';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'closed';
    default:
      return 'open';
  }
}

class TripService {
  /**
   * Get list of trips with optional filters
   */
  async getTrips(params: TripSearchParams = {}): Promise<PaginatedResponse<Trip>> {
    try {
      const trips = await supabaseTripService.getMyTrips();
      const transformedTrips = await Promise.all(trips.map(transformDatabaseTripToTrip));
      
      return {
        success: true,
        data: transformedTrips,
        pagination: {
          page: params.page || 1,
          limit: params.limit || transformedTrips.length,
          total: transformedTrips.length,
          totalPages: 1,
        },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch trips');
    }
  }

  /**
   * Get trip details by ID
   */
  async getTripById(tripId: string): Promise<Trip> {
    try {
      const dbTrip = await supabaseTripService.getTripById(tripId);
      if (!dbTrip) {
        throw new Error('Trip not found');
      }
      return await transformDatabaseTripToTrip(dbTrip);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get trip details');
    }
  }

  /**
   * Create a new trip
   * Automatically sets user_id from authenticated user
   */
  async createTrip(tripData: CreateTripData): Promise<Trip> {
    try {
      const insertData = transformCreateTripDataToInsertTrip(tripData);
      const dbTrip = await supabaseTripService.createTrip(insertData);
      return await transformDatabaseTripToTrip(dbTrip);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create trip');
    }
  }

  /**
   * Update an existing trip
   */
  async updateTrip(tripData: UpdateTripData): Promise<Trip> {
    try {
      const updates: any = {};
      if (tripData.title) updates.title = tripData.title;
      if (tripData.description) updates.description = tripData.description;
      if (tripData.destination) {
        updates.destination = {
          city: tripData.destination.city,
          country: tripData.destination.country,
          coordinates: tripData.destination.coordinates,
        };
      }
      if (tripData.dates) {
        updates.start_date = tripData.dates.startDate;
        updates.end_date = tripData.dates.endDate;
      }
      if (tripData.budget) {
        updates.budget = {
          total: tripData.budget.total,
          currency: tripData.budget.currency,
        };
      }
      if (tripData.maxParticipants) updates.max_participants = tripData.maxParticipants;
      if (tripData.category) updates.trip_type = tripData.category;
      if (tripData.difficulty) updates.difficulty_level = tripData.difficulty;
      if (tripData.visibility) updates.visibility = tripData.visibility;
      if (tripData.tags) updates.tags = tripData.tags;
      if (tripData.images) updates.images = tripData.images;
      if (tripData.itinerary) updates.itinerary = tripData.itinerary;

      const dbTrip = await supabaseTripService.updateTrip(tripData.id, updates);
      return await transformDatabaseTripToTrip(dbTrip);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update trip');
    }
  }

  /**
   * Delete a trip
   */
  async deleteTrip(tripId: string): Promise<void> {
    try {
      await supabaseTripService.deleteTrip(tripId);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete trip');
    }
  }

  /**
   * Join a trip (placeholder - would need trip_participants table)
   */
  async joinTrip(tripId: string): Promise<void> {
    // TODO: Implement using trip_participants table
    throw new Error('Not implemented yet - requires trip_participants table');
  }

  /**
   * Leave a trip (placeholder)
   */
  async leaveTrip(tripId: string): Promise<void> {
    // TODO: Implement using trip_participants table
    throw new Error('Not implemented yet - requires trip_participants table');
  }

  /**
   * Get trip participants (placeholder)
   */
  async getTripParticipants(tripId: string): Promise<TripParticipant[]> {
    // TODO: Implement using trip_participants table
    return [];
  }

  /**
   * Get trip comments (placeholder)
   */
  async getTripComments(tripId: string): Promise<TripComment[]> {
    // TODO: Implement using trip_comments table
    return [];
  }

  /**
   * Add a comment to a trip (placeholder)
   */
  async addTripComment(tripId: string, content: string): Promise<TripComment> {
    // TODO: Implement using trip_comments table
    throw new Error('Not implemented yet - requires trip_comments table');
  }

  /**
   * Like/unlike a trip (placeholder)
   */
  async toggleTripLike(tripId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    // TODO: Implement using trip_likes table
    throw new Error('Not implemented yet - requires trip_likes table');
  }

  /**
   * Search trips
   */
  async searchTrips(searchParams: TripSearchParams): Promise<PaginatedResponse<Trip>> {
    return this.getTrips(searchParams);
  }

  /**
   * Get nearby trips based on location
   */
  async getNearbyTrips(latitude: number, longitude: number, radius: number = 50): Promise<Trip[]> {
    // TODO: Implement location-based search with PostGIS
    const publicTrips = await supabaseTripService.getPublicTrips();
    const transformedTrips = await Promise.all(publicTrips.map(transformDatabaseTripToTrip));
    return transformedTrips;
  }
}

// Export singleton instance
export const tripService = new TripService();
export default tripService;