/**
 * API Response Types
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface Trip {
  id: string;
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
  visibility: string;
  status: string;
  tags: string[];
  images?: string[];
  itinerary?: any[];
  requirements?: string[];
  organizer_id: string;
  organizer?: string;
  organizerAvatar?: string;
  participants?: any[];
  participantCount?: number;
  likes?: string[];
  likeCount?: number;
  comments?: any[];
  commentCount?: number;
  isLiked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TripsListResponse {
  trips: Trip[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface CreateTripRequest {
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

export interface CreateTripResponse {
  trip: Trip;
}