/**
 * Follow Service
 * Handles follow/unfollow operations and social network features
 */

import { apiRequest } from '@/utils/api';
import { apiConfig } from '@/config/api';

export interface FollowUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url: string;
  is_private: boolean;
  followed_at?: string;
}

export interface SuggestedUser extends FollowUser {
  bio?: string;
  follower_count: number;
}

export interface FollowStats {
  userId: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  followsBack: boolean;
}

export const followService = {
  /**
   * Follow a user
   */
  async followUser(userId: string) {
    const response = await apiRequest(
      `${apiConfig.baseURL}/follows/${userId}`,
      {
        method: 'POST',
      }
    ) as any;
    return response;
  },

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string) {
    const response = await apiRequest(
      `${apiConfig.baseURL}/follows/${userId}`,
      {
        method: 'DELETE',
      }
    ) as any;
    return response;
  },

  /**
   * Check if current user follows target user
   */
  async checkFollowStatus(userId: string): Promise<boolean> {
    const response = await apiRequest(
      `${apiConfig.baseURL}/follows/${userId}/status`
    ) as any;
    return response.data?.isFollowing || false;
  },

  /**
   * Get followers for a user
   */
  async getFollowers(userId: string): Promise<FollowUser[]> {
    const response = await apiRequest(
      `${apiConfig.baseURL}/follows/followers/${userId}`
    ) as any;
    return response.data?.followers || [];
  },

  /**
   * Get users being followed by a user
   */
  async getFollowing(userId: string): Promise<FollowUser[]> {
    const response = await apiRequest(
      `${apiConfig.baseURL}/follows/following/${userId}`
    ) as any;
    return response.data?.following || [];
  },

  /**
   * Get suggested users to follow
   */
  async getSuggestedUsers(limit: number = 10): Promise<SuggestedUser[]> {
    const response = await apiRequest(
      `${apiConfig.baseURL}/follows/suggested?limit=${limit}`
    ) as any;
    return response.data?.users || [];
  },

  /**
   * Get follow statistics for a user
   */
  async getFollowStats(userId: string): Promise<FollowStats> {
    const response = await apiRequest(
      `${apiConfig.baseURL}/follows/stats/${userId}`
    ) as any;
    return response.data;
  },
};
