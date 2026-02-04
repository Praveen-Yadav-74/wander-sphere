/**
 * Story Service
 * Handles story-related operations using the backend API
 */

import { apiRequest } from '@/utils/api';
import { endpoints, buildUrl, ApiResponse } from '@/config/api';

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
  media?: File;
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
    return this.getStories();
  }

  /**
   * Get all stories
   */
  async getStories(): Promise<ApiResponse<StoryFeedResponse>> {
    try {
      const response = await apiRequest<ApiResponse<{ stories: any[], hasMore: boolean }>>(buildUrl(endpoints.stories.list));
      
      // Transform API response to match Story interface if needed
      // The backend response is already very close to the Story interface
      const stories = response.data.stories.map(story => ({
        ...story,
        // Ensure views is an array (backend returns viewCount but not views list yet)
        views: story.views || [],
        // Ensure user avatar is mapped correctly if backend uses avatar_url
        user: {
          ...story.user,
          avatar: story.user.avatar || story.user.avatar_url
        }
      }));

      return {
        success: true,
        data: { 
          stories,
          hasMore: response.data.hasMore || false
        }
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch stories');
    }
  }

  /**
   * Get story by ID
   */
  async getStoryById(storyId: string): Promise<ApiResponse<{ story: Story }>> {
    try {
      const response = await apiRequest<ApiResponse<{ story: any }>>(buildUrl(endpoints.stories.detail(storyId)));
      
      const story = {
        ...response.data.story,
        views: response.data.story.views || [],
        user: {
          ...response.data.story.user,
          avatar: response.data.story.user.avatar || response.data.story.user.avatar_url
        }
      };

      return {
        success: true,
        data: { story }
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get story');
    }
  }

  /**
   * Create a new story
   */
  async createStory(storyData: CreateStoryData, mediaUrl?: string, tripId?: string): Promise<ApiResponse<{ story: Story }>> {
    try {
      const formData = new FormData();
      
      if (storyData.media) {
        formData.append('media', storyData.media);
      }
      
      if (mediaUrl) {
        formData.append('mediaUrl', mediaUrl);
      }
      
      if (storyData.mediaType) {
        // formData.append('mediaType', storyData.mediaType); // Backend determines type from file or url extension
      }
      
      if (tripId) {
        formData.append('tripId', tripId);
      }
      
      // Optional caption if passed in storyData (interface doesn't have it but Home.tsx might add it later)
      // For now, no caption in CreateStoryData interface.

      const response = await apiRequest<ApiResponse<{ story: any }>>(buildUrl(endpoints.stories.create), {
        method: 'POST',
        body: formData
      });

      const story = {
        ...response.data.story,
        views: [],
        user: {
          ...response.data.story.user,
          avatar: response.data.story.user.avatar || response.data.story.user.avatar_url
        }
      };
      
      return {
        success: true,
        data: { story }
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create story');
    }
  }

  /**
   * Delete a story
   */
  async deleteStory(storyId: string): Promise<ApiResponse<void>> {
    try {
      await apiRequest(buildUrl(endpoints.stories.delete(storyId)), {
        method: 'DELETE'
      });
      
      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete story');
    }
  }

  /**
   * Mark story as viewed
   */
  async viewStory(storyId: string): Promise<ApiResponse<{ viewCount: number }>> {
    try {
      const response = await apiRequest<ApiResponse<{ viewCount: number }>>(buildUrl(endpoints.stories.view(storyId)), {
        method: 'POST'
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to mark story as viewed');
    }
  }
}

// Export singleton instance
export const storyService = new StoryService();
export default storyService;
