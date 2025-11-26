import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/utils/api';
import { toast } from '@/components/ui/use-toast';
import { apiConfig, buildUrl } from '@/config/api';

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  enabled?: boolean;
  skipAuth?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for making API requests with built-in error handling
 * @param initialData Initial data state (optional)
 * @returns API state and request function
 */
export function useApi<T>(endpoint: string, options: UseApiOptions = {}) {
  const {
    method = 'GET',
    headers,
    body,
    timeout = apiConfig.timeout,
    enabled = true,
    skipAuth = false,
    onSuccess,
    onError
  } = options;

  const url = buildUrl(endpoint);

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiRequest<T>(url, {
        method,
        headers,
        body,
        timeout,
        skipAuth
      });

      setState({
        data: result,
        loading: false,
        error: null
      });

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      
      setState({
        data: null,
        loading: false,
        error: errorObj
      });

      if (onError) {
        onError(errorObj);
      }

      // Don't throw in useEffect to prevent infinite loops
      if (method !== 'GET') {
        throw error;
      }
    }
  }, [url, method, timeout, enabled, skipAuth]); // Removed headers, body, onSuccess, onError from deps

  useEffect(() => {
    if (enabled && method === 'GET') {
      fetchData();
    } else if (!enabled) {
      setState(prev => ({ ...prev, loading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled, method]); // Only depend on url, enabled, method

  return {
    ...state,
    refetch: fetchData,
    mutate: fetchData
  };
}

/**
 * Custom hook for retrying failed API requests
 * @param requestFn The API request function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelay Initial delay in milliseconds
 * @returns Function that executes the request with retry logic
 */
export function useApiWithRetry<T>(
  requestFn: (url: string, options?: UseApiOptions) => Promise<T | null>,
  maxRetries: number = 3,
  initialDelay: number = 1000
) {
  const executeWithRetry = useCallback(async (
    url: string,
    options: UseApiOptions = {}
  ): Promise<T | null> => {
    let retries = 0;
    let delay = initialDelay;
    
    while (retries <= maxRetries) {
      try {
        return await requestFn(url, options);
      } catch (error) {
        retries++;
        
        if (retries > maxRetries) {
          throw error;
        }
        
        // Wait for the specified delay before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Exponential backoff
        delay *= 2;
      }
    }
    
    return null;
  }, [requestFn, maxRetries, initialDelay]);
  
  return executeWithRetry;
}