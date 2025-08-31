/**
 * Story Service
 * Handles story-related API operations
 */

import { apiRequest, cachedApiRequest } from '@/utils/api';
import { endpoints, buildUrl, getAuthHeaderSync, ApiResponse, PaginatedResponse } from '@/config/api';
import { CacheKeys, CacheTTL } from '@/services/cacheService';

export interface Story {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  };
  media: string;
  mediaType: 'image' | 'video';
  duration?: number; // for videos
  views: string[];
  createdAt: string;
  expiresAt: string;
  // Computed fields
  viewCount: number;
  isViewed: boolean;
  isOwner: boolean;
  isExpired: boolean;
}

export interface CreateStoryData {
  media: File;
  mediaType: 'image' | 'video';
  duration?: number;
}

export interface StoryFeedResponse {
  stories: Story[];
  hasMore: boolean;
}

class StoryService {
  /**
   * Get stories feed
   */
  async getStoriesFeed(): Promise<ApiResponse<StoryFeedResponse>> {
    const cacheKey = CacheKeys.stories('feed');
    
    return await cachedApiRequest<ApiResponse<StoryFeedResponse>>(
      buildUrl(endpoints.stories.feed),
      cacheKey,
      {
        ttl: CacheTTL.SHORT,
        headers: getAuthHeaderSync(),
      }
    );
  }

  /**
   * Get all stories
   */
  async getStories(): Promise<ApiResponse<{ stories: Story[] }>> {
    const cacheKey = CacheKeys.stories('all');
    
    return await cachedApiRequest<ApiResponse<{ stories: Story[] }>>(
      buildUrl(endpoints.stories.list),
      cacheKey,
      {
        ttl: CacheTTL.SHORT,
        headers: getAuthHeaderSync(),
      }
    );
  }

  /**
   * Get story by ID
   */
  async getStoryById(storyId: string): Promise<ApiResponse<{ story: Story }>> {
    return await apiRequest<ApiResponse<{ story: Story }>>(
      buildUrl(endpoints.stories.detail(storyId)),
      {
        headers: getAuthHeaderSync(),
      }
    );
  }

  /**
   * Create a new story
   */
  async createStory(storyData: CreateStoryData): Promise<ApiResponse<{ story: Story }>> {
    const formData = new FormData();
    formData.append('media', storyData.media);
    formData.append('mediaType', storyData.mediaType);
    
    if (storyData.duration) {
      formData.append('duration', storyData.duration.toString());
    }

    const response = await apiRequest<ApiResponse<{ story: Story }>>(
      buildUrl(endpoints.stories.create),
      {
        method: 'POST',
        headers: {
          ...getAuthHeaderSync(),
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData,
      }
    );

    if (response.success && response.data) {
      return response;
    }

    throw new Error(response.message || 'Failed to create story');
  }

  /**
   * Delete a story
   */
  async deleteStory(storyId: string): Promise<ApiResponse<void>> {
    const response = await apiRequest<ApiResponse<void>>(
      buildUrl(endpoints.stories.delete(storyId)),
      {
        method: 'DELETE',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success) {
      return response;
    }

    throw new Error(response.message || 'Failed to delete story');
  }

  /**
   * Mark story as viewed
   */
  async viewStory(storyId: string): Promise<ApiResponse<{ viewCount: number }>> {
    const response = await apiRequest<ApiResponse<{ viewCount: number }>>(
      buildUrl(endpoints.stories.view(storyId)),
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response;
    }

    throw new Error(response.message || 'Failed to mark story as viewed');
  }
}

// Export singleton instance
export const storyService = new StoryService();
export default storyService;