/**
 * Story Service
 * Handles story-related operations using Supabase directly
 */

import { storyService as supabaseStoryService, userService as supabaseUserService } from './supabaseService';
import type { DatabaseStory, InsertStory } from '@/types/database';
import type { ApiResponse } from '@/config/api';

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

/**
 * Transform DatabaseStory to Story interface
 * Note: DatabaseStory is for blog-style stories, while Story interface expects media-based stories
 * This is a simplified transformation - you may need to adjust based on your actual use case
 */
async function transformDatabaseStoryToStory(dbStory: DatabaseStory): Promise<Story> {
  const user = await supabaseUserService.getUserProfile(dbStory.user_id);
  
  // Use featured_image or first image as media
  const mediaUrl = dbStory.featured_image || (dbStory.images && dbStory.images[0]) || '';
  
  return {
    id: dbStory.id,
    user: {
      id: user?.id || dbStory.user_id,
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      username: user?.username || '',
      avatar: user?.avatar_url || undefined,
    },
    media: mediaUrl,
    mediaType: mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.mov') ? 'video' : 'image',
    views: [], // TODO: Track views separately
    createdAt: dbStory.created_at,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    viewCount: dbStory.views_count || 0,
    isViewed: false, // TODO: Check if current user has viewed
    isOwner: false, // Will be set by caller if needed
    isExpired: false, // Stories don't expire in database, but interface expects it
  };
}

/**
 * Transform CreateStoryData to InsertStory
 * Note: This assumes you'll upload the media first and get a URL
 */
function transformCreateStoryDataToInsertStory(
  storyData: CreateStoryData,
  mediaUrl: string,
  tripId?: string
): InsertStory {
  return {
    title: 'Story', // Default title
    content: '', // Stories are media-based, not text-based
    featured_image: storyData.mediaType === 'image' ? mediaUrl : undefined,
    images: storyData.mediaType === 'image' ? [mediaUrl] : [],
    is_public: true,
    status: 'published',
    trip_id: tripId || null,
  };
}

class StoryService {
  /**
   * Get stories feed
   */
  async getStoriesFeed(): Promise<ApiResponse<StoryFeedResponse>> {
    try {
      const stories = await supabaseStoryService.getPublicStories(20);
      const transformedStories = await Promise.all(stories.map(transformDatabaseStoryToStory));
      
      return {
        success: true,
        data: {
          stories: transformedStories,
          hasMore: transformedStories.length >= 20,
        },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch stories feed');
    }
  }

  /**
   * Get all stories
   */
  async getStories(): Promise<ApiResponse<{ stories: Story[] }>> {
    try {
      const stories = await supabaseStoryService.getMyStories();
      const transformedStories = await Promise.all(stories.map(transformDatabaseStoryToStory));
      
      return {
        success: true,
        data: { stories: transformedStories },
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
      const dbStory = await supabaseStoryService.getStoryById(storyId);
      if (!dbStory) {
        throw new Error('Story not found');
      }
      const story = await transformDatabaseStoryToStory(dbStory);
      
      return {
        success: true,
        data: { story },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get story');
    }
  }

  /**
   * Create a new story
   * Note: You need to upload the media file first and get a URL
   * This method expects a mediaUrl parameter
   */
  async createStory(storyData: CreateStoryData, mediaUrl: string, tripId?: string): Promise<ApiResponse<{ story: Story }>> {
    try {
      // TODO: Upload media file to Supabase Storage first
      // For now, assuming mediaUrl is provided
      const insertData = transformCreateStoryDataToInsertStory(storyData, mediaUrl, tripId);
      const dbStory = await supabaseStoryService.createStory(insertData);
      const story = await transformDatabaseStoryToStory(dbStory);
      
      return {
        success: true,
        data: { story },
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
      await supabaseStoryService.deleteStory(storyId);
      return {
        success: true,
        data: undefined,
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
      // Increment views_count
      const dbStory = await supabaseStoryService.getStoryById(storyId);
      if (!dbStory) {
        throw new Error('Story not found');
      }
      
      const updatedStory = await supabaseStoryService.updateStory(storyId, {
        views_count: (dbStory.views_count || 0) + 1,
      });
      
      return {
        success: true,
        data: { viewCount: updatedStory.views_count || 0 },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to mark story as viewed');
    }
  }
}

// Export singleton instance
export const storyService = new StoryService();
export default storyService;