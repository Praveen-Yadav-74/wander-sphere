/**
 * Booking Service
 * Handles booking-related API operations for partners and features
 */

import { apiRequest, cachedApiRequest } from '@/utils/api';
import { endpoints, buildUrl, getAuthHeaderSync, ApiResponse, PaginatedResponse } from '@/config/api';
import { CacheKeys, CacheTTL } from '@/services/cacheService';

export interface BookingPartner {
  id: string;
  name: string;
  description: string;
  type: 'flights' | 'hotels' | 'cars' | 'activities' | 'packages';
  url: string;
  rating: number;
  logo?: string;
  featured: boolean;
  commission?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'booking' | 'planning' | 'support';
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerData {
  name: string;
  description: string;
  type: 'flights' | 'hotels' | 'cars' | 'activities' | 'packages';
  url: string;
  rating?: number;
  logo?: string;
  featured?: boolean;
  commission?: number;
}

export interface UpdatePartnerData extends Partial<CreatePartnerData> {
  id: string;
}

export interface CreateFeatureData {
  title: string;
  description: string;
  icon: string;
  category: 'booking' | 'planning' | 'support';
  order?: number;
}

export interface UpdateFeatureData extends Partial<CreateFeatureData> {
  id: string;
}

export interface BookingSearchParams {
  type?: string;
  featured?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

class BookingService {
  /**
   * Get list of booking partners
   */
  async getBookingPartners(params: BookingSearchParams = {}): Promise<PaginatedResponse<BookingPartner>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const url = queryParams.toString() 
      ? `${buildUrl(endpoints.booking.partners)}?${queryParams.toString()}`
      : buildUrl(endpoints.booking.partners);
    
    return await cachedApiRequest<PaginatedResponse<BookingPartner>>(
      url,
      {
        method: 'GET',
        headers: getAuthHeaderSync(),
      },
      CacheKeys.BOOKING_PARTNERS,
      CacheTTL.MEDIUM
    );
  }

  /**
   * Get list of booking features
   */
  async getBookingFeatures(): Promise<ApiResponse<BookingFeature[]>> {
    const url = buildUrl(endpoints.booking.features);
    
    return await cachedApiRequest<ApiResponse<BookingFeature[]>>(
      url,
      {
        method: 'GET',
        headers: getAuthHeaderSync(),
      },
      CacheKeys.BOOKING_FEATURES,
      CacheTTL.LONG
    );
  }

  /**
   * Get a specific booking partner by ID
   */
  async getBookingPartner(partnerId: string): Promise<ApiResponse<BookingPartner>> {
    const url = buildUrl(endpoints.booking.partnerDetail(partnerId));
    
    return await apiRequest<ApiResponse<BookingPartner>>(url, {
      method: 'GET',
      headers: getAuthHeaderSync(),
    });
  }

  /**
   * Create a new booking partner (admin only)
   */
  async createBookingPartner(data: CreatePartnerData): Promise<ApiResponse<BookingPartner>> {
    const url = buildUrl(endpoints.booking.partners);
    
    return await apiRequest<ApiResponse<BookingPartner>>(url, {
      method: 'POST',
      headers: getAuthHeaderSync(),
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a booking partner (admin only)
   */
  async updateBookingPartner(data: UpdatePartnerData): Promise<ApiResponse<BookingPartner>> {
    const url = buildUrl(endpoints.booking.partnerDetail(data.id));
    
    return await apiRequest<ApiResponse<BookingPartner>>(url, {
      method: 'PUT',
      headers: getAuthHeaderSync(),
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a booking partner (admin only)
   */
  async deleteBookingPartner(partnerId: string): Promise<ApiResponse<void>> {
    const url = buildUrl(endpoints.booking.partnerDetail(partnerId));
    
    return await apiRequest<ApiResponse<void>>(url, {
      method: 'DELETE',
      headers: getAuthHeaderSync(),
    });
  }

  /**
   * Create a new booking feature (admin only)
   */
  async createBookingFeature(data: CreateFeatureData): Promise<ApiResponse<BookingFeature>> {
    const url = buildUrl(endpoints.booking.features);
    
    return await apiRequest<ApiResponse<BookingFeature>>(url, {
      method: 'POST',
      headers: getAuthHeaderSync(),
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a booking feature (admin only)
   */
  async updateBookingFeature(data: UpdateFeatureData): Promise<ApiResponse<BookingFeature>> {
    const url = buildUrl(endpoints.booking.featureDetail(data.id));
    
    return await apiRequest<ApiResponse<BookingFeature>>(url, {
      method: 'PUT',
      headers: getAuthHeaderSync(),
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a booking feature (admin only)
   */
  async deleteBookingFeature(featureId: string): Promise<ApiResponse<void>> {
    const url = buildUrl(endpoints.booking.featureDetail(featureId));
    
    return await apiRequest<ApiResponse<void>>(url, {
      method: 'DELETE',
      headers: getAuthHeaderSync(),
    });
  }

  /**
   * Track partner click/visit for analytics
   */
  async trackPartnerVisit(partnerId: string): Promise<ApiResponse<void>> {
    const url = buildUrl(endpoints.booking.trackVisit(partnerId));
    
    return await apiRequest<ApiResponse<void>>(url, {
      method: 'POST',
      headers: getAuthHeaderSync(),
    });
  }
}

// Export singleton instance
export const bookingService = new BookingService();
export default bookingService;