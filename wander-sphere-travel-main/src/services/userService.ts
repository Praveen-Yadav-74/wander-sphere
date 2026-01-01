/**
 * User Service
 * Handles user-related API operations including profile management and social features
 */

import { apiRequest, cachedApiRequest } from '@/utils/api';
import { endpoints, buildUrl, getAuthHeaderSync, ApiResponse, PaginatedResponse } from '@/config/api';
import { CacheKeys, CacheTTL } from '@/services/cacheService';
import { User } from './authService';

export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  tripsCount: number;
  journeysCount: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  is_private?: boolean;
  privacy_settings?: {
    profile_visibility?: 'public' | 'private' | 'friends';
    location_sharing?: boolean;
    showEmail?: boolean;
    showPhone?: boolean;
    show_location?: boolean;
    show_travel_stats?: boolean;
    allow_tagging?: boolean;
  };
  stats: {
    countriesVisited: number;
    citiesVisited: number;
    totalDistance: number;
    totalTrips: number;
  };
  preferences: {
    travelStyle: string[];
    budget: string;
    interests: string[];
    languages: string[];
  };
  socialLinks: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
}

export interface UpdateProfileData {
  name?: string;
  username?: string;
  bio?: string;
  location?: string;
  avatar?: string;
  preferences?: {
    travelStyle?: string[];
    budget?: string;
    interests?: string[];
    languages?: string[];
  };
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
}

export interface UserSearchParams {
  query?: string;
  location?: string;
  interests?: string[];
  travelStyle?: string[];
  page?: number;
  limit?: number;
}

export interface FollowUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  location?: string;
  isFollowing: boolean;
  followedAt?: string;
}

export interface PrivacySettings {
  isPrivate: boolean;
  showLocation: boolean;
  showTravelStats: boolean;
  allowTagging: boolean;
}

class UserService {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await cachedApiRequest<ApiResponse<UserProfile>>(
      buildUrl(endpoints.users.profile),
      CacheKeys.userProfile('current'),
      {
        ttl: CacheTTL.MEDIUM,
        method: 'GET',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get profile');
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: UpdateProfileData): Promise<UserProfile> {
    const response = await apiRequest<ApiResponse<UserProfile>>(
      buildUrl(endpoints.users.updateProfile),
      {
        method: 'PUT',
        headers: getAuthHeaderSync(),
        body: profileData,
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update profile');
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiRequest<ApiResponse<{ avatarUrl: string }>>(
      buildUrl(endpoints.users.uploadAvatar),
      {
        method: 'POST',
        headers: {
          ...getAuthHeaderSync(),
          // Don't set Content-Type for FormData, let browser set it
        },
        body: formData,
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to upload avatar');
  }

  /**
   * Get user profile by ID or username
   */
  async getUserProfile(identifier: string): Promise<UserProfile> {
    const response = await cachedApiRequest<ApiResponse<UserProfile>>(
      `${buildUrl(endpoints.users.profile)}/${identifier}`,
      CacheKeys.userProfile(identifier),
      {
        ttl: CacheTTL.MEDIUM,
        method: 'GET',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get user profile');
  }

  /**
   * Follow a user
   */
  async followUser(userId: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(
      buildUrl(endpoints.users.follow(userId)),
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to follow user');
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(
      buildUrl(endpoints.users.unfollow(userId)),
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to unfollow user');
    }
  }

  /**
   * Get user followers
   */
  async getFollowers(userId?: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<FollowUser>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (userId) {
      queryParams.append('userId', userId);
    }

    const url = `${buildUrl(endpoints.users.followers)}?${queryParams.toString()}`;
    const cacheKey = CacheKeys.followers(userId || 'current');
    
    return await cachedApiRequest<PaginatedResponse<FollowUser>>(url, cacheKey, {
      ttl: CacheTTL.SHORT,
      method: 'GET',
      headers: getAuthHeaderSync(),
    });
  }

  /**
   * Get users that the user is following
   */
  async getFollowing(userId?: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<FollowUser>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (userId) {
      queryParams.append('userId', userId);
    }

    const url = `${buildUrl(endpoints.users.following)}?${queryParams.toString()}`;
    const cacheKey = CacheKeys.following(userId || 'current');
    
    return await cachedApiRequest<PaginatedResponse<FollowUser>>(url, cacheKey, {
      ttl: CacheTTL.SHORT,
      method: 'GET',
      headers: getAuthHeaderSync(),
    });
  }

  /**
   * Search users
   */
  async searchUsers(searchParams: UserSearchParams): Promise<PaginatedResponse<UserProfile>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const url = queryParams.toString() 
      ? `${buildUrl(endpoints.users.search)}?${queryParams.toString()}`
      : buildUrl(endpoints.users.search);
    
    return await apiRequest<PaginatedResponse<UserProfile>>(url, {
      method: 'GET',
      headers: getAuthHeaderSync(),
    });
  }

  /**
   * Get user suggestions (people you might know)
   */
  async getUserSuggestions(limit: number = 10): Promise<UserProfile[]> {
    const response = await apiRequest<ApiResponse<UserProfile[]>>(
      `${buildUrl(endpoints.users.search)}/suggestions?limit=${limit}`,
      {
        method: 'GET',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get user suggestions');
  }

  /**
   * Get user travel statistics
   */
  async getUserStats(userId?: string): Promise<UserProfile['stats']> {
    const url = userId 
      ? `${buildUrl(endpoints.users.profile)}/${userId}/stats`
      : `${buildUrl(endpoints.users.profile)}/stats`;

    const response = await apiRequest<ApiResponse<UserProfile['stats']>>(
      url,
      {
        method: 'GET',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get user stats');
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: UserProfile['preferences']): Promise<UserProfile['preferences']> {
    const response = await apiRequest<ApiResponse<UserProfile['preferences']>>(
      `${buildUrl(endpoints.users.profile)}/preferences`,
      {
        method: 'PUT',
        headers: getAuthHeaderSync(),
        body: preferences,
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update preferences');
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: any): Promise<any> {
    const response = await apiRequest<ApiResponse<any>>(
      buildUrl(endpoints.notifications.settings),
      {
        method: 'PUT',
        headers: getAuthHeaderSync(),
        body: settings,
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update notification settings');
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<any> {
    const response = await apiRequest<ApiResponse<any>>(
      buildUrl(endpoints.notifications.settings),
      {
        method: 'GET',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get notification settings');
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(settings: any): Promise<any> {
    const response = await apiRequest<ApiResponse<any>>(
      `${buildUrl(endpoints.users.profile)}/privacy`,
      {
        method: 'PUT',
        headers: getAuthHeaderSync(),
        body: settings,
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update privacy settings');
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(
      `${buildUrl(endpoints.users.profile)}/password`,
      {
        method: 'PUT',
        headers: getAuthHeaderSync(),
        body: { currentPassword, newPassword },
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to change password');
    }
  }

  /**
   * Block a user
   */
  async blockUser(userId: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(
      `${buildUrl(endpoints.users.profile)}/${userId}/block`,
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to block user');
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(
      `${buildUrl(endpoints.users.profile)}/${userId}/unblock`,
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to unblock user');
    }
  }

  /**
   * Report a user
   */
  async reportUser(userId: string, reason: string, description?: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(
      `${buildUrl(endpoints.users.profile)}/${userId}/report`,
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
        body: { reason, description },
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to report user');
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;