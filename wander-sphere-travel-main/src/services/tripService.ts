/**
 * Trip Service
 * Handles trip-related API operations
 */

import { apiRequest } from '@/utils/api';
import { endpoints, buildUrl, getAuthHeaderSync, ApiResponse, PaginatedResponse } from '@/config/api';

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
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  maxParticipants: number;
  type: string;
  tags: string[];
  meetingPoint?: string;
  requirements?: string[];
  itinerary?: Omit<TripItinerary, 'id'>[];
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

class TripService {
  /**
   * Get list of trips with optional filters
   */
  async getTrips(params: TripSearchParams = {}): Promise<PaginatedResponse<Trip>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const url = `${buildUrl(endpoints.trips.list)}?${queryParams.toString()}`;
    
    return await apiRequest<PaginatedResponse<Trip>>(url, {
      method: 'GET',
      headers: getAuthHeaderSync(),
    });
  }

  /**
   * Get trip details by ID
   */
  async getTripById(tripId: string): Promise<Trip> {
    const response = await apiRequest<ApiResponse<Trip>>(
      buildUrl(endpoints.trips.detail(tripId)),
      {
        method: 'GET',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get trip details');
  }

  /**
   * Create a new trip
   */
  async createTrip(tripData: CreateTripData): Promise<Trip> {
    const response = await apiRequest<ApiResponse<Trip>>(
      buildUrl(endpoints.trips.create),
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
        body: tripData,
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to create trip');
  }

  /**
   * Update an existing trip
   */
  async updateTrip(tripData: UpdateTripData): Promise<Trip> {
    const response = await apiRequest<ApiResponse<Trip>>(
      buildUrl(endpoints.trips.update(tripData.id)),
      {
        method: 'PUT',
        headers: getAuthHeaderSync(),
        body: tripData,
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update trip');
  }

  /**
   * Delete a trip
   */
  async deleteTrip(tripId: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(
      buildUrl(endpoints.trips.delete(tripId)),
      {
        method: 'DELETE',
        headers: getAuthHeaderSync(),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete trip');
    }
  }

  /**
   * Join a trip
   */
  async joinTrip(tripId: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(
      buildUrl(endpoints.trips.join(tripId)),
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to join trip');
    }
  }

  /**
   * Leave a trip
   */
  async leaveTrip(tripId: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(
      buildUrl(endpoints.trips.leave(tripId)),
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to leave trip');
    }
  }

  /**
   * Get trip participants
   */
  async getTripParticipants(tripId: string): Promise<TripParticipant[]> {
    const response = await apiRequest<ApiResponse<TripParticipant[]>>(
      buildUrl(endpoints.trips.participants(tripId)),
      {
        method: 'GET',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get trip participants');
  }

  /**
   * Get trip comments
   */
  async getTripComments(tripId: string): Promise<TripComment[]> {
    const response = await apiRequest<ApiResponse<TripComment[]>>(
      buildUrl(endpoints.trips.comments(tripId)),
      {
        method: 'GET',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get trip comments');
  }

  /**
   * Add a comment to a trip
   */
  async addTripComment(tripId: string, content: string): Promise<TripComment> {
    const response = await apiRequest<ApiResponse<TripComment>>(
      buildUrl(endpoints.trips.comments(tripId)),
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
        body: { content },
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to add comment');
  }

  /**
   * Like/unlike a trip
   */
  async toggleTripLike(tripId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    const response = await apiRequest<ApiResponse<{ isLiked: boolean; likesCount: number }>>(
      buildUrl(endpoints.trips.like(tripId)),
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to toggle like');
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
    const response = await apiRequest<ApiResponse<Trip[]>>(
      `${buildUrl(endpoints.trips.nearby)}?lat=${latitude}&lng=${longitude}&radius=${radius}`,
      {
        method: 'GET',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get nearby trips');
  }
}

// Export singleton instance
export const tripService = new TripService();
export default tripService;