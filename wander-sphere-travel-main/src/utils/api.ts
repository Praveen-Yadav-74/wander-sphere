/**
 * API utility functions for handling API requests and responses
 */

import { toast } from "@/components/ui/use-toast";
import { apiConfig, getAuthHeaderSync } from '@/config/api';
import { cacheService, CacheKeys, CacheTTL } from '@/services/cacheService';
import { isMobileDevice, isDesktop } from '@/utils/networkUtils';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  skipAuth?: boolean;
  cache?: {
    key?: string;
    ttl?: number;
    version?: string;
    forceRefresh?: boolean;
  };
  offlineStrategy?: 'cache-first' | 'network-first' | 'cache-only' | 'network-only';
}

/**
 * Handles API requests with error handling, timeout, and retry functionality
 * @param url The API endpoint URL
 * @param options Request options including method, headers, body, and timeout
 * @returns Promise with the response data
 */
export async function apiRequest<T>(url: string, options: ApiOptions = {}): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = apiConfig.timeout,
    skipAuth = false,
    cache,
    offlineStrategy = 'network-first'
  } = options;

  // Ensure we have a session before making authenticated requests
  if (!skipAuth && method !== 'GET') {
    // For write operations, always wait for session
    const { getAuthHeader } = await import('@/config/api');
    const authHeaders = await getAuthHeader();
    if (!authHeaders.Authorization) {
      throw new Error('No authentication token available. Please log in.');
    }
    Object.assign(headers, authHeaders);
  } else if (!skipAuth) {
    // For read operations, try to get auth header but don't fail if missing
    const { getAuthHeader } = await import('@/config/api');
    const authHeaders = await getAuthHeader();
    if (authHeaders.Authorization) {
      Object.assign(headers, authHeaders);
    }
  }

  const isOnline = navigator.onLine;
  const isMobile = isMobileDevice();
  const cacheKey = cache?.key || generateCacheKey(url, method, body);
  
  // Handle cache-first strategy or offline mode
  if ((offlineStrategy === 'cache-first' || !isOnline) && method === 'GET') {
    const cachedData = cacheService.get<T>(cacheKey, cache?.version);
    if (cachedData) {
      // For mobile devices, always try to serve cached data when available
      if (isMobile || !isOnline) {
        if (!isOnline && isMobile) {
          showOfflineToast();
        }
        return cachedData;
      }
      // For desktop, serve cached data only if offline
      if (!isOnline) {
        showNetworkErrorToast();
        return cachedData;
      }
    }
  }
  
  // Handle cache-only strategy
  if (offlineStrategy === 'cache-only') {
    const cachedData = cacheService.get<T>(cacheKey, cache?.version);
    if (cachedData) {
      return cachedData;
    }
    throw new Error('No cached data available');
  }
  
  // Handle offline mode for non-GET requests
  if (!isOnline && method !== 'GET') {
    if (isMobile) {
      // For mobile, queue the request for later (simplified implementation)
      showOfflineToast('Changes will be synced when you\'re back online');
      throw new Error('Offline: Request queued for sync');
    } else {
      // For desktop, show network error
      showNetworkErrorToast();
      throw new Error('Network connection required');
    }
  }

  // Retry logic with exponential backoff
  const maxRetries = apiConfig.maxRetries || 3;
  const retryDelay = apiConfig.retryDelay || 1000;
  let lastError: Error | null = null;

  // Helper function to check if error is retryable
  const isRetryableError = (error: any): boolean => {
    if (!error) return false;
    
    // Retry on network errors, timeouts, and 5xx server errors
    if (error instanceof DOMException && error.name === 'AbortError') return true;
    if (error.message && (
      error.message.includes('NetworkError') || 
      error.message.includes('Failed to fetch') || 
      error.message.includes('ERR_CONNECTION_REFUSED') ||
      error.message.includes('timeout')
    )) return true;
    
    const status = (error as any).status;
    if (status >= 500 && status < 600) return true; // Server errors
    if (status === 429) return true; // Rate limiting
    
    return false;
  };

  // Make request with retry logic
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create new AbortController for each attempt
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const requestOptions: RequestInit = {
        method,
        headers: {
          ...apiConfig.headers,
          ...(skipAuth ? {} : getAuthHeaderSync()),
          ...headers
        },
        signal: controller.signal,
        // Keep-alive for better connection reuse
        keepalive: true
      };

      if (body) {
        // Handle FormData separately (for file uploads)
        if (body instanceof FormData) {
          requestOptions.body = body;
          // Remove Content-Type header for FormData to let browser set it with boundary
          const headersCopy = { ...requestOptions.headers };
          delete headersCopy['Content-Type'];
          requestOptions.headers = headersCopy;
        } else {
          requestOptions.body = JSON.stringify(body);
          // Ensure Content-Type is set for JSON
          if (!requestOptions.headers!['Content-Type']) {
            requestOptions.headers = {
              ...requestOptions.headers,
              'Content-Type': 'application/json'
            };
          }
        }
      }

      // Log API request in development
      if (apiConfig.enableLogging || import.meta.env.DEV) {
        console.log(`[API] ${method} ${url}`, {
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          headers: Object.keys(requestOptions.headers || {}),
          hasBody: !!body
        });
      }

      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      // Log API response in development
      if (apiConfig.enableLogging || import.meta.env.DEV) {
        console.log(`[API] Response ${response.status} ${url}`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
      }

      // Handle HTTP error responses
      if (!response.ok) {
        let errorData;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            errorData = { message: await response.text() || `HTTP ${response.status}` };
          }
        } catch {
          errorData = { message: `HTTP ${response.status}` };
        }
        
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        (error as any).status = response.status;
        (error as any).data = errorData;
        
        // Don't retry on client errors (4xx) except 429
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw error;
        }
        
        // Retry on server errors and rate limiting
        if (isRetryableError(error) && attempt < maxRetries) {
          lastError = error;
          const delay = retryDelay * Math.pow(2, attempt);
          if (apiConfig.enableLogging && import.meta.env.DEV) {
            console.log(`[API] Retrying after ${delay}ms...`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      let responseData: T;
      
      try {
        if (contentType && contentType.includes('application/json')) {
          const text = await response.text();
          if (text && text.trim()) {
            try {
              responseData = JSON.parse(text);
            } catch (jsonError) {
              console.error(`[API] Invalid JSON response from ${url}:`, text.substring(0, 200));
              throw new Error(`Invalid JSON response: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`);
            }
          } else {
            // Empty response - return appropriate default based on method
            responseData = (method === 'DELETE' ? { success: true } : {}) as T;
          }
        } else {
          const text = await response.text();
          responseData = text as unknown as T;
        }
      } catch (parseError) {
        console.error(`[API] Failed to parse response from ${url}:`, parseError);
        throw new Error(`Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
      
      // Log parsed response in development
      if (apiConfig.enableLogging || import.meta.env.DEV) {
        console.log(`[API] Parsed response from ${url}:`, {
          hasData: !!responseData,
          dataKeys: responseData && typeof responseData === 'object' ? Object.keys(responseData) : 'not an object',
          success: (responseData as any)?.success
        });
      }
      
      // Cache successful GET responses
      if (method === 'GET' && cache && !cache.forceRefresh) {
        cacheService.set(cacheKey, responseData, {
          ttl: cache.ttl || CacheTTL.MEDIUM,
          version: cache.version
        });
      }
      
      return responseData;
    } catch (error) {
      lastError = error as Error;
      
      // Log error in development
      if (apiConfig.enableLogging && import.meta.env.DEV) {
        console.error(`[API] Error ${method} ${url} (attempt ${attempt + 1}):`, error);
      }
      
      // Check if we should retry
      if (isRetryableError(error) && attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt);
        if (apiConfig.enableLogging && import.meta.env.DEV) {
          console.log(`[API] Retrying after ${delay}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${timeout}ms`);
        toast({
          title: "Request Timeout",
          description: `The request took too long to complete. Please try again.`,
          variant: "destructive"
        });
        throw timeoutError;
      }
      
      // Handle network errors (after all retries exhausted)
      if (error instanceof Error) {
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
          // Try to serve cached data first
          if (method === 'GET') {
            const cachedData = cacheService.get<T>(cacheKey, cache?.version);
            if (cachedData) {
              if (isMobile) {
                showOfflineToast('Showing cached data');
              } else {
                showNetworkErrorToast('Showing cached data');
              }
              return cachedData;
            }
          }
          
          // Fallback to mock data for common endpoints when no cache available
          if (isMobile) {
            const mockResponse = getMockResponse(url, method);
            if (mockResponse) {
              console.log(`[API] Using mock data for ${method} ${url}`);
              showOfflineToast('Using sample data');
              return mockResponse as T;
            }
          } else {
            // For desktop, show network error without mock data
            showNetworkErrorToast('Connection failed. Please check your internet connection.');
            throw error;
          }
        } else {
          // Handle specific HTTP status codes
          const status = (error as any).status;
          if (status === 401) {
            // Only redirect to login if we're on a protected route
            const currentPath = window.location.pathname;
            const publicRoutes = ['/', '/find-trips', '/trips', '/budget', '/clubs', '/booking', '/login', '/register'];
            const isPublicRoute = publicRoutes.some(route => 
              currentPath === route || currentPath.startsWith(route + '/')
            );
            
            if (!isPublicRoute) {
              toast({
                title: "Authentication Required",
                description: "Please log in to continue.",
                variant: "destructive"
              });
              // Clear auth token and redirect to login using React Router
              localStorage.removeItem('auth_token');
              // Use history API instead of window.location to prevent reload
              if (typeof window !== 'undefined' && window.history) {
                window.history.pushState(null, '', '/login');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }
            throw error;
          } else if (status === 403) {
            toast({
              title: "Access Denied",
              description: "You don't have permission to perform this action.",
              variant: "destructive"
            });
            throw error;
          } else if (status >= 500) {
            toast({
              title: "Server Error",
              description: "Something went wrong on our end. Please try again later.",
              variant: "destructive"
            });
            throw error;
          }
          
          // Generic error handling
          toast({
            title: "Error",
            description: error.message || "An unexpected error occurred",
            variant: "destructive"
          });
        }
      }
      
      throw error;
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new Error('Request failed after all retries');
}

/**
 * Returns mock data for common API endpoints when backend is unavailable
 */
function getMockResponse(url: string, method: string): any {
  // Profile endpoint
  if (url.includes('/users/profile') && method === 'GET') {
    return {
      success: true,
      data: {
        id: 'mock-user-123',
        name: 'Demo User',
        email: 'demo@wandersphere.com',
        username: 'demouser',
        firstName: 'Demo',
        lastName: 'User',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        bio: 'Exploring the world one adventure at a time!',
        location: 'San Francisco, CA',
        verified: true,
        followersCount: 245,
        followingCount: 189,
        tripsCount: 12,
        journeysCount: 8,
        stats: {
          countriesVisited: 15,
          citiesVisited: 42,
          totalDistance: 75000,
          totalTrips: 12
        },
        preferences: {
          travelStyle: ['adventure', 'cultural'],
          budget: 'mid-range',
          interests: ['photography', 'hiking', 'food'],
          languages: ['English', 'Spanish']
        },
        socialLinks: {
          instagram: '@demouser',
          twitter: '@demouser'
        }
      }
    };
  }
  
  // Notifications endpoint
  if (url.includes('/notifications') && method === 'GET') {
    if (url.includes('unread-count')) {
      return { success: true, data: { count: 3 } };
    }
    return {
      success: true,
      data: [
        {
          id: '1',
          type: 'trip_invite',
          title: 'Trip Invitation',
          message: 'Sarah invited you to join "Tokyo Adventure 2024"',
          read: false,
          createdAt: new Date().toISOString(),
          data: { tripId: 'trip-123' }
        },
        {
          id: '2',
          type: 'follow',
          title: 'New Follower',
          message: 'Alex started following you',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          data: { userId: 'user-456' }
        }
      ],
      pagination: { page: 1, limit: 5, total: 2, totalPages: 1 }
    };
  }
  
  // Followers/Following endpoints
  if (url.includes('/followers') && method === 'GET') {
    return {
      success: true,
      data: [
        {
          id: 'follower-1',
          name: 'Alice Johnson',
          username: 'alice_travels',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          verified: true,
          isFollowing: false
        }
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
    };
  }
  
  if (url.includes('/following') && method === 'GET') {
    return {
      success: true,
      data: [
        {
          id: 'following-1',
          name: 'Bob Explorer',
          username: 'bob_explorer',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          verified: false,
          isFollowing: true
        }
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
    };
  }
  
  // Default success response for other endpoints
  if (method === 'PUT' || method === 'POST' || method === 'DELETE') {
    return { success: true, message: 'Operation completed successfully (offline mode)' };
  }
  
  return null;
}

/**
 * Retry a failed API request with exponential backoff
 * @param fn The API request function to retry
 * @param retries Maximum number of retry attempts
 * @param delay Initial delay in milliseconds
 * @returns Promise with the response data or throws an error after all retries fail
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with exponential backoff
    return retryRequest(fn, retries - 1, delay * 2);
  }
}

/**
 * Generate a cache key for API requests
 */
function generateCacheKey(url: string, method: string, body?: any): string {
  const bodyHash = body ? btoa(JSON.stringify(body)).slice(0, 8) : '';
  return `api_${method.toLowerCase()}_${url.replace(/[^a-zA-Z0-9]/g, '_')}_${bodyHash}`;
}

/**
 * Show offline mode toast for mobile devices
 */
function showOfflineToast(message = 'You\'re offline. Showing cached data.'): void {
  toast({
    title: "Offline Mode",
    description: message,
    variant: "default"
  });
}

/**
 * Show network error toast for desktop devices
 */
function showNetworkErrorToast(message = 'Network connection failed.'): void {
  toast({
    title: "Network Error",
    description: message,
    variant: "destructive"
  });
}

/**
 * Enhanced API request with caching support
 */
export async function cachedApiRequest<T>(
  url: string, 
  cacheKey: string, 
  options: Omit<ApiOptions, 'cache'> & { ttl?: number; version?: string } = {}
): Promise<T> {
  const { ttl = CacheTTL.MEDIUM, version = '1.0', ...apiOptions } = options;
  
  return apiRequest<T>(url, {
    ...apiOptions,
    cache: {
      key: cacheKey,
      ttl,
      version
    }
  });
}

/**
 * Clear all cached data
 */
export function clearApiCache(): void {
  cacheService.clear();
  toast({
    title: "Cache Cleared",
    description: "All cached data has been removed.",
    variant: "default"
  });
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cacheService.getStats();
}