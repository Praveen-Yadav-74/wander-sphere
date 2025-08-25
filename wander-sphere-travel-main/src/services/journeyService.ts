/**
 * Journey Service
 * Handles journey/post-related API operations
 */

import { apiRequest, cachedApiRequest } from '@/utils/api';
import { endpoints, buildUrl, getAuthHeaderSync, ApiResponse, PaginatedResponse } from '@/config/api';
import { CacheKeys, CacheTTL } from '@/services/cacheService';

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

class JourneyService {
  /**
   * Get list of journeys with optional filters
   */
  async getJourneys(params: JourneySearchParams = {}): Promise<PaginatedResponse<Journey>> {
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

    const url = `${buildUrl(endpoints.journeys.list)}?${queryParams.toString()}`;
    const cacheKey = `journeys_list_${queryParams.toString()}`;
    
    return await cachedApiRequest<PaginatedResponse<Journey>>(url, cacheKey, {
      ttl: CacheTTL.SHORT,
      headers: getAuthHeaderSync(),
    });
  }

  /**
   * Get user's own journeys
   */
  async getMyJourneys(status?: 'draft' | 'published' | 'archived'): Promise<ApiResponse<{ journeys: Journey[] }>> {
    const queryParams = new URLSearchParams();
    if (status) {
      queryParams.append('status', status);
    }

    const url = `/journeys/my-journeys?${queryParams.toString()}`;
    const cacheKey = CacheKeys.userJourneys(`current_${status || 'all'}`);
    
    return await cachedApiRequest<ApiResponse<{ journeys: Journey[] }>>(
      buildUrl(url),
      cacheKey,
      {
        ttl: CacheTTL.SHORT,
        headers: getAuthHeaderSync(),
      }
    );
  }

  /**
   * Get journey by ID
   */
  async getJourney(journeyId: string): Promise<ApiResponse<{ journey: Journey }>> {
    const response = await cachedApiRequest<ApiResponse<{ journey: Journey }>>(
      buildUrl(endpoints.journeys.detail(journeyId)),
      CacheKeys.journeyDetail(journeyId),
      {
        ttl: CacheTTL.MEDIUM,
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response;
    }

    throw new Error(response.message || 'Failed to get journey');
  }

  /**
   * Create a new journey
   */
  async createJourney(journeyData: CreateJourneyData): Promise<ApiResponse<{ journey: Journey }>> {
    const response = await apiRequest<ApiResponse<{ journey: Journey }>>(
      buildUrl(endpoints.journeys.create),
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
        body: journeyData,
      }
    );

    if (response.success && response.data) {
      return response;
    }

    throw new Error(response.message || 'Failed to create journey');
  }

  /**
   * Update journey
   */
  async updateJourney(journeyId: string, journeyData: UpdateJourneyData): Promise<ApiResponse<{ journey: Journey }>> {
    const response = await apiRequest<ApiResponse<{ journey: Journey }>>(
      buildUrl(endpoints.journeys.update(journeyId)),
      {
        method: 'PUT',
        headers: getAuthHeaderSync(),
        body: journeyData,
      }
    );

    if (response.success && response.data) {
      return response;
    }

    throw new Error(response.message || 'Failed to update journey');
  }

  /**
   * Delete journey
   */
  async deleteJourney(journeyId: string): Promise<ApiResponse<{}>> {
    const response = await apiRequest<ApiResponse<{}>>(
      buildUrl(endpoints.journeys.delete(journeyId)),
      {
        method: 'DELETE',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success) {
      return response;
    }

    throw new Error(response.message || 'Failed to delete journey');
  }

  /**
   * Like/unlike journey
   */
  async toggleLike(journeyId: string): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> {
    const response = await apiRequest<ApiResponse<{ isLiked: boolean; likeCount: number }>>(
      buildUrl(endpoints.journeys.like(journeyId)),
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response;
    }

    throw new Error(response.message || 'Failed to toggle like');
  }

  /**
   * Add comment to journey
   */
  async addComment(journeyId: string, content: string): Promise<ApiResponse<{ comment: JourneyComment; commentCount: number }>> {
    const response = await apiRequest<ApiResponse<{ comment: JourneyComment; commentCount: number }>>(
      buildUrl(endpoints.journeys.comment(journeyId)),
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
        body: { content },
      }
    );

    if (response.success && response.data) {
      return response;
    }

    throw new Error(response.message || 'Failed to add comment');
  }

  /**
   * Get featured journeys
   */
  async getFeaturedJourneys(): Promise<ApiResponse<{ journeys: Journey[] }>> {
    const response = await cachedApiRequest<ApiResponse<{ journeys: Journey[] }>>(
      buildUrl('/journeys/featured'),
      'featured_journeys',
      {
        ttl: CacheTTL.LONG,
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response;
    }

    throw new Error(response.message || 'Failed to get featured journeys');
  }

  /**
   * Share journey
   */
  async shareJourney(journeyId: string): Promise<ApiResponse<{ shareCount: number }>> {
    const response = await apiRequest<ApiResponse<{ shareCount: number }>>(
      buildUrl(endpoints.journeys.share(journeyId)),
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response;
    }

    throw new Error(response.message || 'Failed to share journey');
  }
}

// Export singleton instance
export const journeyService = new JourneyService();
export default journeyService;