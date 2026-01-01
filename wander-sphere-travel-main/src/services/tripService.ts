/**
 * Trip Service
 * Handles trip-related operations using Supabase directly
 */

import { tripService as supabaseTripService, userService as supabaseUserService } from './supabaseService';
import type { DatabaseTrip, InsertTrip } from '@/types/database';
import { apiRequest } from '@/utils/api';
import { endpoints, buildUrl, ApiResponse } from '@/config/api';
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

interface TripUserAPI {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
}

interface TripParticipantAPI {
  id: string;
  user?: TripUserAPI;
  role?: string;
  status?: string;
  joined_at?: string;
}

interface TripCommentAPI {
  id: string;
  user?: TripUserAPI;
  content: string;
  created_at: string;
  updated_at: string;
  likes?: number;
}

interface TripAPI {
  id: string;
  title: string;
  description?: string;
  destination?: {
    country?: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  } | string;
  start_date?: string;
  end_date?: string;
  budget?: { total?: number; currency?: string } | string;
  max_participants?: number;
  maxParticipants?: number;
  organizer?: TripUserAPI;
  organizer_id?: string;
  participants?: TripParticipantAPI[];
  images?: string[];
  tags?: string[];
  category?: string;
  trip_type?: string;
  status?: string;
  meetingPoint?: string;
  requirements?: string[];
  itinerary?: unknown[];
  created_at?: string;
  updated_at?: string;
  comments?: TripCommentAPI[];
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
  itinerary?: unknown[];
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
  
  // Format destination as string
  const destinationStr = dbTrip.destination?.city && dbTrip.destination?.country
    ? `${dbTrip.destination.city}, ${dbTrip.destination.country}`
    : 'Unknown destination';
  
  // Format budget as string
  const budgetStr = dbTrip.budget?.total
    ? `${dbTrip.budget.currency || 'USD'} ${dbTrip.budget.total}`
    : 'Not specified';
  
  // Calculate duration
  const startDate = new Date(dbTrip.start_date);
  const endDate = new Date(dbTrip.end_date);
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const durationStr = `${durationDays} day${durationDays !== 1 ? 's' : ''}`;
  
  return {
    id: dbTrip.id,
    title: dbTrip.title,
    description: dbTrip.description || '',
    destination: destinationStr,
    startDate: dbTrip.start_date,
    endDate: dbTrip.end_date,
    duration: durationStr,
    budget: budgetStr,
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
    itinerary: (dbTrip.itinerary || []) as TripItinerary[],
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
    itinerary: tripData.itinerary as any,
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
      const response = await apiRequest<ApiResponse<{ trip: TripAPI }>>(buildUrl(endpoints.trips.detail(tripId)), {
        method: 'GET',
      });
      const trip = response.data.trip;
      const acceptedParticipants = (trip.participants || []).filter((p: TripParticipantAPI) => p.status === 'accepted');
      
      // Format destination as string
      const destinationStr = typeof trip.destination === 'object' && trip.destination?.city
        ? `${trip.destination.city}, ${trip.destination.country || ''}`
        : (typeof trip.destination === 'string' ? trip.destination : 'Unknown destination');
      
      // Calculate duration
      const startDate = new Date(trip.start_date);
      const endDate = new Date(trip.end_date);
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const durationStr = `${durationDays} day${durationDays !== 1 ? 's' : ''}`;
      
      return {
        id: trip.id,
        title: trip.title,
        description: trip.description || '',
        destination: destinationStr,
        startDate: trip.start_date || '',
        endDate: trip.end_date || '',
        duration: durationStr,
        budget: typeof trip.budget === 'object' && trip.budget?.total
          ? `${trip.budget.currency || 'USD'} ${trip.budget.total}`
          : (typeof trip.budget === 'string' ? trip.budget : ''),
        maxParticipants: trip.max_participants || trip.maxParticipants || 1,
        currentParticipants: acceptedParticipants.length || 1,
        organizer: {
          id: (trip.organizer?.id || trip.organizer_id) || '',
          name: trip.organizer ? `${trip.organizer.first_name || ''} ${trip.organizer.last_name || ''}`.trim() : '',
          username: trip.organizer?.username || '',
          avatar: trip.organizer?.avatar_url || undefined,
          bio: '',
        },
        participants: (trip.participants || []).map((p: TripParticipantAPI) => ({
          id: p.id,
          userId: p.user?.id || '',
          name: p.user ? `${p.user.first_name || ''} ${p.user.last_name || ''}`.trim() : '',
          username: p.user?.username || '',
          avatar: p.user?.avatar_url || undefined,
          role: p.role === 'organizer' ? 'organizer' : 'participant',
          joinedAt: p.joined_at,
        })),
        images: trip.images || [],
        tags: trip.tags || [],
        type: trip.category || trip.trip_type || '',
        status: trip.status === 'cancelled' ? 'closed' : (acceptedParticipants.length >= (trip.max_participants || 0) ? 'full' : 'open'),
        meetingPoint: trip.meetingPoint,
        requirements: trip.requirements || [],
        itinerary: (trip.itinerary || []) as TripItinerary[],
        createdAt: trip.created_at || '',
        updatedAt: trip.updated_at || '',
      };
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
      const updates: Record<string, unknown> = {};
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
  async joinTrip(tripId: string, message?: string): Promise<void> {
    await apiRequest<ApiResponse<Record<string, unknown>>>(buildUrl(endpoints.trips.request(tripId)), {
      method: 'POST',
      body: { message: message || '' }
    });
  }

  /**
   * Leave a trip (placeholder)
   */
  async leaveTrip(tripId: string): Promise<void> {
    // TODO: Implement using trip_participants table
    throw new Error('Not implemented yet - requires trip_participants table');
  }

  /**
   * Get user's trip requests ("My Interests")
   */
  async getMyTripRequests(): Promise<any[]> {
    try {
      const response = await apiRequest<ApiResponse<any[]>>(buildUrl(endpoints.trips.requestsMy), {
        method: 'GET',
      });
      return response.data || [];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch trip requests');
    }
  }

  /**
   * Get requests for a specific trip (Host only)
   */
  async getTripRequests(tripId: string): Promise<any[]> {
    try {
      const response = await apiRequest<ApiResponse<any[]>>(buildUrl(endpoints.trips.requestsForTrip(tripId)), {
        method: 'GET',
      });
      return response.data || [];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch trip requests');
    }
  }

  /**
   * Approve a trip request (Host only)
   */
  async approveTripRequest(requestId: string): Promise<void> {
    await apiRequest(buildUrl(endpoints.trips.approveRequest(requestId)), {
      method: 'POST',
    });
  }

  /**
   * Reject a trip request (Host only)
   */
  async rejectTripRequest(requestId: string): Promise<void> {
    await apiRequest(buildUrl(endpoints.trips.rejectRequest(requestId)), {
      method: 'POST',
    });
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
    const response = await apiRequest<ApiResponse<{ trip: TripAPI }>>(buildUrl(endpoints.trips.detail(tripId)), {
      method: 'GET',
    });
    const comments = (response.data.trip.comments || []) as TripCommentAPI[];
    return comments.map((c: TripCommentAPI) => ({
      id: c.id,
      userId: c.user?.id || '',
      user: {
        name: c.user ? `${c.user.first_name || ''} ${c.user.last_name || ''}`.trim() : 'Unknown',
        username: c.user?.username || '',
        avatar: c.user?.avatar_url || undefined,
      },
      content: c.content,
      likes: c.likes ?? 0,
      isLiked: false,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  }

  /**
   * Add a comment to a trip (placeholder)
   */
  async addTripComment(tripId: string, content: string): Promise<TripComment> {
    const response = await apiRequest<ApiResponse<{ comment: TripCommentAPI }>>(buildUrl(endpoints.trips.comments(tripId)), {
      method: 'POST',
      body: { content }
    });
    const c = response.data.comment;
    return {
      id: c.id,
      userId: c.user?.id || '',
      user: {
        name: c.user ? `${c.user.first_name || ''} ${c.user.last_name || ''}`.trim() : 'Unknown',
        username: c.user?.username || '',
        avatar: c.user?.avatar_url || undefined,
      },
      content: c.content,
      likes: c.likes ?? 0,
      isLiked: false,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
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
