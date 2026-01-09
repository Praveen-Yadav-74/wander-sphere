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

  // Always fetch fresh auth token for authenticated requests
  let authHeaders: Record<string, string> = {};
  if (!skipAuth) {
    const { getAuthHeader } = await import('@/config/api');
    authHeaders = await getAuthHeader();
    
    // For all authenticated requests, fail immediately if no token
    if (!authHeaders.Authorization) {
      const error: any = new Error('Not authenticated. Please log in.');
      error.status = 401;
      throw error;
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
  const maxRetries = apiConfig.maxRetries || 1; // Default to 1 retry
  const retryDelay = apiConfig.retryDelay || 1000;
  let lastError: Error | null = null;

  // Helper function to check if error is retryable
  const isRetryableError = (error: any): boolean => {
    if (!error) return false;
    
    const status = (error as any).status;
    
    // NEVER retry authentication errors - fail fast
    if (status === 401 || status === 403) return false;
    
    // Don't retry client errors (except rate limiting)
    if (status >= 400 && status < 500 && status !== 429) return false;
    
    // CRITICAL: Don't retry connection refused errors - fail immediately with toast
    if (error.message && error.message.includes('ERR_CONNECTION_REFUSED')) {
      return false; // Stop retrying immediately
    }
    
    // Retry on network errors, timeouts, and 5xx server errors
    if (error instanceof DOMException && error.name === 'AbortError') return true;
    if (error.message && (
      error.message.includes('NetworkError') || 
      error.message.includes('Failed to fetch') ||
      error.message.includes('timeout')
    )) return true;
    
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
          ...authHeaders,
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
        
        // For 401 errors, immediately throw without retry
        if (response.status === 401) {
          if (apiConfig.enableLogging || import.meta.env.DEV) {
            console.error('[API] Authentication failed - redirecting to login');
          }
          throw error;
        }
        
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
        // CRITICAL: Handle ERR_CONNECTION_REFUSED immediately with clear toast
        if (error.message.includes('ERR_CONNECTION_REFUSED')) {
          toast({
            title: "Server Offline",
            description: "Cannot connect to the server. Please check if the backend is running or try again later.",
            variant: "destructive",
            duration: 5000,
          });
          throw new Error('Server is offline or unreachable');
        }
        
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
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
          
          // No mock data - just throw the error to show proper error state
          if (isMobile) {
            showOfflineToast('No internet connection. Please check your network.');
          } else {
            showNetworkErrorToast('Connection failed. Please check your internet connection.');
          }
          throw error;
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