/**
 * API Configuration
 * Centralized configuration for backend API endpoints and settings
 */

import { supabase } from './supabase';

// Environment variables with fallbacks
// Production: https://wander-sphere-ue7e.onrender.com
// Development: http://localhost:5000
// Android Emulator: http://10.0.2.2:5000

const PRODUCTION_BACKEND = 'https://wander-sphere-ue7e.onrender.com';
const LOCAL_BACKEND = 'http://localhost:5000';
const EMULATOR_BACKEND = 'http://10.0.2.2:5000'; // Android emulator host access

let cachedBackendUrl: string | null = null;
let lastHealthCheck: number = 0;
const HEALTH_CHECK_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

/**
 * Check if local backend is healthy and reachable
 * @param baseUrl - The backend URL to check
 * @returns Promise<boolean> - true if healthy, false otherwise
 */
const checkBackendHealth = async (baseUrl: string): Promise<boolean> => {
  try {
    console.log(`[API Config] 🏥 Checking backend health: ${baseUrl}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
    
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    
    clearTimeout(timeoutId);
    const isHealthy = response.ok;
    console.log(`[API Config] ${isHealthy ? '✅' : '❌'} Backend health check: ${baseUrl} - ${response.status}`);
    return isHealthy;
  } catch (error) {
    console.log(`[API Config] ❌ Backend unreachable: ${baseUrl}`);
    return false;
  }
};

/**
 * Detect if running on Android emulator
 * @returns boolean - true if on emulator
 */
const isAndroidEmulator = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('android') && 
         (window.location.hostname === 'localhost' || window.location.hostname === '10.0.2.2');
};

/**
 * Get API base URL with smart environment detection and automatic fallback
 * Priority:
 * 1. Explicit VITE_API_BASE_URL env variable
 * 2. Health check localhost (if on localhost/127.0.0.1)
 * 3. Health check Android emulator host (if detected)
 * 4. Fallback to production Render backend
 */
const getApiBaseUrl = async (): Promise<string> => {
  // If explicitly set in env, use that (highest priority)
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('[API Config] 🎯 Using explicit VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Check cache to avoid repeated health checks
  const now = Date.now();
  if (cachedBackendUrl && (now - lastHealthCheck) < HEALTH_CHECK_CACHE_DURATION) {
    console.log('[API Config] 💾 Using cached backend URL:', cachedBackendUrl);
    return cachedBackendUrl;
  }

  // Detect environment
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  
  const isProduction = import.meta.env.MODE === 'production' || 
                       import.meta.env.PROD === true ||
                       (!isLocalhost && window.location.hostname !== '10.0.2.2');

  // If definitely production (Vercel, etc.), skip health checks
  if (isProduction && !isLocalhost) {
    console.log('[API Config] 🌐 Production environment detected, using Render backend');
    cachedBackendUrl = PRODUCTION_BACKEND;
    lastHealthCheck = now;
    return PRODUCTION_BACKEND;
  }

  // Development: Try localhost first
  if (isLocalhost) {
    console.log('[API Config] 🏠 Localhost detected, checking local backend...');
    const isLocalHealthy = await checkBackendHealth(LOCAL_BACKEND);
    
    if (isLocalHealthy) {
      console.log('[API Config] ✅ Using local backend:', LOCAL_BACKEND);
      cachedBackendUrl = LOCAL_BACKEND;
      lastHealthCheck = now;
      return LOCAL_BACKEND;
    }
    
    console.log('[API Config] ⚠️ Local backend unavailable, falling back to production');
  }

  // Android Emulator: Try emulator host access
  if (isAndroidEmulator()) {
    console.log('[API Config] 📱 Android emulator detected, checking host backend...');
    const isEmulatorHealthy = await checkBackendHealth(EMULATOR_BACKEND);
    
    if (isEmulatorHealthy) {
      console.log('[API Config] ✅ Using emulator host backend:', EMULATOR_BACKEND);
      cachedBackendUrl = EMULATOR_BACKEND;
      lastHealthCheck = now;
      return EMULATOR_BACKEND;
    }
    
    console.log('[API Config] ⚠️ Emulator host backend unavailable, falling back to production');
  }

  // Final fallback: Always use production
  console.log('[API Config] 🚀 Using production backend (final fallback):', PRODUCTION_BACKEND);
  cachedBackendUrl = PRODUCTION_BACKEND;
  lastHealthCheck = now;
  return PRODUCTION_BACKEND;
};

// Initialize with production as default (will be updated by getApiBaseUrl)
let API_BASE_URL = PRODUCTION_BACKEND;
const API_BASE_URL_WITH_PREFIX = `${API_BASE_URL}/api`;
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '60000'); // Increased to 60s for cold starts
// Enable logging in development by default
const ENABLE_API_LOGGING = import.meta.env.VITE_ENABLE_API_LOGGING === 'true' || import.meta.env.DEV;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // Initial retry delay in ms

// API Configuration
export const apiConfig = {
  baseURL: API_BASE_URL_WITH_PREFIX,
  timeout: API_TIMEOUT,
  enableLogging: ENABLE_API_LOGGING,
  maxRetries: MAX_RETRIES,
  retryDelay: RETRY_DELAY,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Connection': 'keep-alive', // Keep connections alive
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
    request: (tripId: string) => `/trips/${tripId}/request`,
    requestsMy: '/trips/requests/my',
    requestsForTrip: (tripId: string) => `/trips/${tripId}/requests`,
    approveRequest: (requestId: string) => `/trips/requests/${requestId}/approve`,
    rejectRequest: (requestId: string) => `/trips/requests/${requestId}/reject`,
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
    myJourneys: '/journeys/my-journeys',
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

  // Wallet
  wallet: {
    details: '/wallet',
    createOrder: '/wallet/create-order',
    verifyPayment: '/wallet/verify-payment',
    withdraw: '/wallet/withdraw',
  },

  // Etrav API (B2B Travel APIs)
  etrav: {
    // Bus
    bus: {
      search: '/etrav/bus/search',
      seatLayout: '/etrav/bus/seat-layout',
      block: '/etrav/bus/block',
      book: '/etrav/bus/book',
    },
    // Flight
    flight: {
      search: '/etrav/flight/search',
      fareRules: '/etrav/flight/fare-rules',
      ssr: '/etrav/flight/ssr',
      book: '/etrav/flight/book',
    },
    // Hotel
    hotel: {
      search: '/etrav/hotel/search',
      roomTypes: '/etrav/hotel/room-types',
      block: '/etrav/hotel/block',
      book: '/etrav/hotel/book',
    },
  },
};

// Initialize backend URL asynchronously on module load
// This ensures the first API call gets the correct backend
(async () => {
  try {
    const detectedUrl = await getApiBaseUrl();
    API_BASE_URL = detectedUrl;
    // Update apiConfig to reflect the detected URL
    apiConfig.baseURL = `${API_BASE_URL}/api`;
    console.log('[API Config] ✅ Backend initialized:', API_BASE_URL);
  } catch (error) {
    console.error('[API Config] ❌ Failed to detect backend, using production:', error);
    API_BASE_URL = PRODUCTION_BACKEND;
    apiConfig.baseURL = `${PRODUCTION_BACKEND}/api`;
  }
})();

// Helper function to build full URL (synchronous - uses cached backend)
export const buildUrl = (endpoint: string): string => {
  const url = `${apiConfig.baseURL}${endpoint}`;
  // Log in development to help debug
  if (import.meta.env.DEV) {
    console.log(`[API Config] Building URL: ${url}`);
  }
  return url;
};

// Helper function to build full URL with dynamic backend detection (async)
// Use this for the first API call or when you need to ensure latest backend
export const buildUrlAsync = async (endpoint: string): Promise<string> => {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}/api${endpoint}`;
  if (import.meta.env.DEV) {
    console.log(`[API Config] Building async URL: ${url}`);
  }
  return url;
};

// Helper function to get authorization header - ALWAYS WAITS FOR SESSION
export const getAuthHeader = async (): Promise<Record<string, string>> => {
  try {
    // Always wait for session to ensure token is available
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('Error getting session:', error);
      return {};
    }
    
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
    
    // No session found
    console.warn('No active session found');
    return {};
  } catch (error) {
    console.warn('Error in getAuthHeader:', error);
    return {};
  }
};

// Synchronous version - tries to get from localStorage but may not have latest token
// Use getAuthHeader() for guaranteed fresh token
export const getAuthHeaderSync = (): Record<string, string> => {
  try {
    // Try to get Supabase session from localStorage
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
      const sessionKey = `sb-${projectRef}-auth-token`;
      const supabaseSession = localStorage.getItem(sessionKey);
      
      if (supabaseSession) {
        try {
          const session = JSON.parse(supabaseSession);
          const accessToken = session?.access_token;
          if (accessToken) {
            return { Authorization: `Bearer ${accessToken}` };
          }
        } catch (error) {
          console.warn('Failed to parse Supabase session:', error);
        }
      }
    }
    
    // Fallback to old token method for backward compatibility
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    console.warn('Error getting auth header:', error);
    return {};
  }
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
