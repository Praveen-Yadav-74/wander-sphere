/**
 * Journey Service
 * Handles journey/post-related operations using Supabase directly
 */

import { journeyService as supabaseJourneyService, userService as supabaseUserService, tripService as supabaseTripService } from './supabaseService';
import type { DatabaseJourney, InsertJourney } from '@/types/database';
import type { ApiResponse, PaginatedResponse } from '@/config/api';

export interface Journey {
  id: string;
  title: string;
  description: string;
  content: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  };
  images: string[];
  tags: string[];
  destinations: string[];
  duration?: string;
  budget?: string;
  difficulty: 'easy' | 'moderate' | 'challenging' | 'extreme';
  season: string[];
  likes: string[];
  comments: JourneyComment[];
  views: number;
  shares: number;
  featured: boolean;
  isPublic: boolean;
  status: 'draft' | 'published' | 'archived';
  metadata: {
    readTime: number;
    wordCount: number;
  };
  createdAt: string;
  updatedAt: string;
  // Computed fields
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isOwner: boolean;
}

export interface JourneyComment {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJourneyData {
  title: string;
  description: string;
  content: string;
  isPublic?: boolean;
  tags?: string[];
  destinations?: string[];
  difficulty?: string;
  season?: string[];
  images?: string[];
}

export interface UpdateJourneyData {
  title?: string;
  description?: string;
  content?: string;
  isPublic?: boolean;
  tags?: string[];
  destinations?: string[];
  difficulty?: string;
  season?: string[];
  status?: string;
  images?: string[];
}

export interface JourneySearchParams {
  page?: number;
  limit?: number;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  author?: string;
  tags?: string[];
  destinations?: string[];
  difficulty?: string;
}

/**
 * Transform DatabaseJourney to Journey interface
 */
async function transformDatabaseJourneyToJourney(dbJourney: DatabaseJourney): Promise<Journey> {
  // Get author info
  const author = await supabaseUserService.getUserProfile(dbJourney.user_id);
  
  return {
    id: dbJourney.id,
    title: dbJourney.title,
    description: dbJourney.description || '',
    content: dbJourney.description || '', // Using description as content
    author: {
      id: author?.id || dbJourney.user_id,
      firstName: author?.first_name || '',
      lastName: author?.last_name || '',
      username: author?.username || '',
      avatar: author?.avatar_url || undefined,
    },
    images: dbJourney.photos || [],
    tags: [], // TODO: Extract from activities or notes if needed
    destinations: dbJourney.location ? [dbJourney.location.city || '', dbJourney.location.country || ''].filter(Boolean) : [],
    difficulty: 'easy' as const, // Default, could extract from activities
    season: [], // Not in database schema
    likes: [], // TODO: Fetch from likes table if exists
    comments: [], // TODO: Fetch from comments table if exists
    views: 0,
    shares: 0,
    featured: false,
    isPublic: dbJourney.is_public || false,
    status: 'published' as const, // Default, not in database schema
    metadata: {
      readTime: 0,
      wordCount: (dbJourney.description || '').split(' ').length,
    },
    createdAt: dbJourney.created_at,
    updatedAt: dbJourney.updated_at,
    likeCount: 0,
    commentCount: 0,
    isLiked: false,
    isOwner: false, // Will be set by caller if needed
  };
}

/**
 * Transform CreateJourneyData to InsertJourney
 */
function transformCreateJourneyDataToInsertJourney(journeyData: CreateJourneyData, tripId?: string): InsertJourney {
  return {
    title: journeyData.title,
    description: journeyData.description || journeyData.content,
    journey_date: new Date().toISOString().split('T')[0], // Today's date
    location: journeyData.destinations && journeyData.destinations.length > 0 ? {
      city: journeyData.destinations[0] || '',
      country: journeyData.destinations[1] || '',
    } : undefined,
    activities: [], // Could be extracted from content
    photos: journeyData.images,
    notes: journeyData.content,
    is_public: journeyData.isPublic !== false, // Default to true
    trip_id: tripId || null,
  };
}

class JourneyService {
  /**
   * Get list of journeys with optional filters
   */
  async getJourneys(params: JourneySearchParams = {}): Promise<PaginatedResponse<Journey>> {
    try {
      const journeys = await supabaseJourneyService.getPublicJourneys(params.limit || 20);
      const transformedJourneys = await Promise.all(journeys.map(transformDatabaseJourneyToJourney));
      
      return {
        success: true,
        data: transformedJourneys,
        pagination: {
          page: params.page || 1,
          limit: params.limit || transformedJourneys.length,
          total: transformedJourneys.length,
          totalPages: 1,
        },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch journeys');
    }
  }

  /**
   * Get user's own journeys
   */
  async getMyJourneys(status?: 'draft' | 'published' | 'archived'): Promise<ApiResponse<{ journeys: Journey[] }>> {
    try {
      const journeys = await supabaseJourneyService.getMyJourneys();
      const transformedJourneys = await Promise.all(journeys.map(transformDatabaseJourneyToJourney));
      
      return {
        success: true,
        data: { journeys: transformedJourneys },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch my journeys');
    }
  }

  /**
   * Get journey by ID
   */
  async getJourney(journeyId: string): Promise<ApiResponse<{ journey: Journey }>> {
    try {
      const dbJourney = await supabaseJourneyService.getJourneyById(journeyId);
      if (!dbJourney) {
        throw new Error('Journey not found');
      }
      const journey = await transformDatabaseJourneyToJourney(dbJourney);
      
      return {
        success: true,
        data: { journey },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get journey');
    }
  }

  /**
   * Create a new journey
   * Automatically sets user_id from authenticated user
   * Optionally includes trip_id if journey belongs to a trip
   */
  async createJourney(journeyData: CreateJourneyData, tripId?: string): Promise<ApiResponse<{ journey: Journey }>> {
    try {
      const insertData = transformCreateJourneyDataToInsertJourney(journeyData, tripId);
      const dbJourney = await supabaseJourneyService.createJourney(insertData);
      const journey = await transformDatabaseJourneyToJourney(dbJourney);
      
      return {
        success: true,
        data: { journey },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create journey');
    }
  }

  /**
   * Update journey
   */
  async updateJourney(journeyId: string, journeyData: UpdateJourneyData): Promise<ApiResponse<{ journey: Journey }>> {
    try {
      const updates: any = {};
      if (journeyData.title) updates.title = journeyData.title;
      if (journeyData.description) updates.description = journeyData.description;
      if (journeyData.content) updates.notes = journeyData.content;
      if (journeyData.isPublic !== undefined) updates.is_public = journeyData.isPublic;
      if (journeyData.images) updates.photos = journeyData.images;

      const dbJourney = await supabaseJourneyService.updateJourney(journeyId, updates);
      const journey = await transformDatabaseJourneyToJourney(dbJourney);
      
      return {
        success: true,
        data: { journey },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update journey');
    }
  }

  /**
   * Delete journey
   */
  async deleteJourney(journeyId: string): Promise<ApiResponse<{}>> {
    try {
      await supabaseJourneyService.deleteJourney(journeyId);
      return {
        success: true,
        data: {},
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete journey');
    }
  }

  /**
   * Like/unlike journey (placeholder)
   */
  async toggleLike(journeyId: string): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> {
    // TODO: Implement using likes table if exists
    throw new Error('Not implemented yet - requires likes table');
  }

  /**
   * Add comment to journey (placeholder)
   */
  async addComment(journeyId: string, content: string): Promise<ApiResponse<{ comment: JourneyComment; commentCount: number }>> {
    // TODO: Implement using comments table if exists
    throw new Error('Not implemented yet - requires comments table');
  }

  /**
   * Get featured journeys
   */
  async getFeaturedJourneys(): Promise<ApiResponse<{ journeys: Journey[] }>> {
    // Return public journeys as featured for now
    return this.getJourneys({ limit: 10 });
  }

  /**
   * Share journey (placeholder)
   */
  async shareJourney(journeyId: string): Promise<ApiResponse<{ shareCount: number }>> {
    // TODO: Implement share tracking
    return {
      success: true,
      data: { shareCount: 0 },
    };
  }
}

// Export singleton instance
export const journeyService = new JourneyService();
export default journeyService;