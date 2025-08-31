/**
 * API Configuration
 * Centralized configuration for backend API endpoints and settings
 */

import { supabase } from './supabase';

// Environment variables with fallbacks
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wander-sphere-ue7e.onrender.com';
const API_BASE_URL_WITH_PREFIX = `${API_BASE_URL}/api`;
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '20000');
const ENABLE_API_LOGGING = import.meta.env.VITE_ENABLE_API_LOGGING === 'true';

// API Configuration
export const apiConfig = {
  baseURL: API_BASE_URL_WITH_PREFIX,
  timeout: API_TIMEOUT,
  enableLogging: ENABLE_API_LOGGING,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// API Endpoints
export const endpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },

  // Users
  users: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
    uploadAvatar: '/media/avatar',
    followers: '/users/followers',
    following: '/users/following',
    follow: (userId: string) => `/users/${userId}/follow`,
    unfollow: (userId: string) => `/users/${userId}/unfollow`,
    search: '/users/search',
  },

  // Trips
  trips: {
    list: '/trips',
    create: '/trips',
    detail: (tripId: string) => `/trips/${tripId}`,
    update: (tripId: string) => `/trips/${tripId}`,
    delete: (tripId: string) => `/trips/${tripId}`,
    join: (tripId: string) => `/trips/${tripId}/join`,
    leave: (tripId: string) => `/trips/${tripId}/leave`,
    participants: (tripId: string) => `/trips/${tripId}/participants`,
    comments: (tripId: string) => `/trips/${tripId}/comments`,
    like: (tripId: string) => `/trips/${tripId}/like`,
    search: '/trips/search',
    nearby: '/trips/nearby',
  },

  // Clubs
  clubs: {
    list: '/clubs',
    create: '/clubs',
    detail: (clubId: string) => `/clubs/${clubId}`,
    update: (clubId: string) => `/clubs/${clubId}`,
    delete: (clubId: string) => `/clubs/${clubId}`,
    join: (clubId: string) => `/clubs/${clubId}/join`,
    leave: (clubId: string) => `/clubs/${clubId}/leave`,
    members: (clubId: string) => `/clubs/${clubId}/members`,
    posts: (clubId: string) => `/clubs/${clubId}/posts`,
    search: '/clubs/search',
  },

  // Journeys/Posts
  journeys: {
    list: '/journeys',
    create: '/journeys',
    detail: (journeyId: string) => `/journeys/${journeyId}`,
    update: (journeyId: string) => `/journeys/${journeyId}`,
    delete: (journeyId: string) => `/journeys/${journeyId}`,
    like: (journeyId: string) => `/journeys/${journeyId}/like`,
    comment: (journeyId: string) => `/journeys/${journeyId}/comments`,
    share: (journeyId: string) => `/journeys/${journeyId}/share`,
    feed: '/journeys/feed',
    trending: '/journeys/trending',
  },

  // Stories
  stories: {
    list: '/stories',
    create: '/stories',
    detail: (storyId: string) => `/stories/${storyId}`,
    delete: (storyId: string) => `/stories/${storyId}`,
    view: (storyId: string) => `/stories/${storyId}/view`,
    feed: '/stories/feed',
  },

  // Budget
  budget: {
    list: '/budget',
    create: '/budget',
    detail: (budgetId: string) => `/budget/${budgetId}`,
    update: (budgetId: string) => `/budget/${budgetId}`,
    delete: (budgetId: string) => `/budget/${budgetId}`,
    expenses: (budgetId: string) => `/budget/${budgetId}/expenses`,
    addExpense: (budgetId: string) => `/budget/${budgetId}/expenses`,
    updateExpense: (budgetId: string, expenseId: string) => `/budget/${budgetId}/expenses/${expenseId}`,
    deleteExpense: (budgetId: string, expenseId: string) => `/budget/${budgetId}/expenses/${expenseId}`,
  },

  // Booking
  booking: {
    partners: '/booking/partners',
    partnerDetail: (partnerId: string) => `/booking/partners/${partnerId}`,
    features: '/booking/features',
    featureDetail: (featureId: string) => `/booking/features/${featureId}`,
    trackVisit: (partnerId: string) => `/booking/partners/${partnerId}/visit`,
  },

  // Notifications
  notifications: {
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    markRead: (notificationId: string) => `/notifications/${notificationId}/read`,
    markAllRead: '/notifications/read-all',
    delete: (notificationId: string) => `/notifications/${notificationId}`,
    settings: '/notifications/settings',
  },

  // Search
  search: {
    global: '/search',
    users: '/search/users',
    trips: '/search/trips',
    clubs: '/search/clubs',
    journeys: '/search/journeys',
    suggestions: '/search/suggestions',
  },

  // Media
  media: {
    avatar: '/media/avatar',
    tripImages: '/media/trip-images',
    temp: '/media/temp',
    deleteTripImage: (storagePath: string) => `/media/trip-image/${storagePath}`,
    deleteTemp: (storagePath: string) => `/media/temp/${storagePath}`,
    cleanup: '/media/cleanup-temp',
    info: (storagePath: string) => `/media/info/${storagePath}`,
    health: '/media/health',
  },

  // Map/Location
  map: {
    places: '/map/places',
    nearby: '/map/nearby',
    geocode: '/map/geocode',
    reverseGeocode: '/map/reverse-geocode',
  },
};

// Helper function to build full URL
export const buildUrl = (endpoint: string): string => {
  return `${apiConfig.baseURL}${endpoint}`;
};

// Helper function to get authorization header
export const getAuthHeader = async (): Promise<Record<string, string>> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  } catch {
    // Fallback to old token method for backward compatibility
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

// Synchronous version for backward compatibility
export const getAuthHeaderSync = (): Record<string, string> => {
  // Try to get Supabase session from localStorage
  const supabaseSession = localStorage.getItem('sb-' + import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
  
  if (supabaseSession) {
    try {
      const session = JSON.parse(supabaseSession);
      const accessToken = session?.access_token;
      return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    } catch {
      // Fallback to old token method for backward compatibility
      const token = localStorage.getItem('authToken');
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
  }
  
  // Fallback to old token method
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: string[];
}

export default apiConfig;