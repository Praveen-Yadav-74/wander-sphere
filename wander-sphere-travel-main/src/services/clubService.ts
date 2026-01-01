/**
 * Club Service
 * Handles club-related API operations
 */

import { apiRequest, cachedApiRequest } from '@/utils/api';
import { endpoints, buildUrl, getAuthHeaderSync, ApiResponse, PaginatedResponse } from '@/config/api';
import { CacheKeys, CacheTTL } from '@/services/cacheService';

export interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  country: string;
  state?: string;
  image: string;
  members: number;
  isJoined: boolean;
  organizer: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  membersList?: ClubMember[];
  posts?: ClubPost[];
  createdAt: string;
  updatedAt: string;
}

export interface ClubMember {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar?: string;
  role: 'organizer' | 'admin' | 'member';
  joinedAt: string;
}

export interface ClubPost {
  id: string;
  clubId: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClubData {
  name: string;
  description: string;
  category: string;
  country: string;
  state?: string;
  image?: string;
}

export interface CreateClubBackendData {
  name: string;
  description: string;
  isPrivate?: boolean;
  tags?: string[];
  rules?: string[];
}

export interface UpdateClubData extends Partial<CreateClubData> {
  id: string;
}

export interface ClubSearchParams {
  query?: string;
  category?: string;
  country?: string;
  state?: string;
  page?: number;
  limit?: number;
}

class ClubService {
  /**
   * Get list of clubs with optional filters
   */
  async getClubs(params: ClubSearchParams = {}): Promise<PaginatedResponse<Club>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const queryParamsString = queryParams.toString();
    const url = queryParamsString 
      ? `${buildUrl(endpoints.clubs.list)}?${queryParamsString}`
      : buildUrl(endpoints.clubs.list);
    const cacheKey = `${CacheKeys.clubs()}_${queryParamsString}`;
    
    return await cachedApiRequest<PaginatedResponse<Club>>(url, cacheKey, {
      ttl: CacheTTL.MEDIUM,
      method: 'GET',
      headers: getAuthHeaderSync(),
    });
  }

  /**
   * Get club by ID
   */
  async getClubById(clubId: string): Promise<Club> {
    const response = await cachedApiRequest<ApiResponse<Club>>(
      buildUrl(endpoints.clubs.detail(clubId)),
      CacheKeys.clubDetail(clubId),
      {
        ttl: CacheTTL.MEDIUM,
        method: 'GET',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get club details');
  }

  /**
   * Create a new club
   */
  async createClub(clubData: CreateClubBackendData): Promise<Club> {
    const response = await apiRequest<ApiResponse<Club>>(
      buildUrl(endpoints.clubs.create),
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
        body: clubData,
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to create club');
  }

  /**
   * Update club
   */
  async updateClub(clubData: UpdateClubData): Promise<Club> {
    const response = await apiRequest<ApiResponse<Club>>(
      buildUrl(endpoints.clubs.update(clubData.id)),
      {
        method: 'PUT',
        headers: getAuthHeaderSync(),
        body: clubData,
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update club');
  }

  /**
   * Delete club
   */
  async deleteClub(clubId: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(
      buildUrl(endpoints.clubs.delete(clubId)),
      {
        method: 'DELETE',
        headers: getAuthHeaderSync(),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete club');
    }
  }

  /**
   * Join a club
   */
  async joinClub(clubId: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(
      buildUrl(endpoints.clubs.join(clubId)),
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to join club');
    }
  }

  /**
   * Leave a club
   */
  async leaveClub(clubId: string): Promise<void> {
    const response = await apiRequest<ApiResponse>(
      buildUrl(endpoints.clubs.leave(clubId)),
      {
        method: 'POST',
        headers: getAuthHeaderSync(),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to leave club');
    }
  }

  /**
   * Get club members
   */
  async getClubMembers(clubId: string): Promise<ClubMember[]> {
    const response = await apiRequest<ApiResponse<ClubMember[]>>(
      buildUrl(endpoints.clubs.members(clubId)),
      {
        method: 'GET',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get club members');
  }

  /**
   * Get club posts
   */
  async getClubPosts(clubId: string): Promise<ClubPost[]> {
    const response = await apiRequest<ApiResponse<ClubPost[]>>(
      buildUrl(endpoints.clubs.posts(clubId)),
      {
        method: 'GET',
        headers: getAuthHeaderSync(),
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to get club posts');
  }

  /**
   * Search clubs
   */
  async searchClubs(searchParams: ClubSearchParams): Promise<PaginatedResponse<Club>> {
    return this.getClubs(searchParams);
  }
}

// Export singleton instance
export const clubService = new ClubService();
export default clubService;