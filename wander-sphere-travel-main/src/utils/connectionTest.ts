/**
 * Connection Test Utility
 * Tests the connection to the backend API
 */

import { apiConfig, buildUrl } from '@/config/api';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    url: string;
    status?: number;
    responseTime?: number;
    error?: string;
  };
}

/**
 * Test connection to backend API
 */
export async function testBackendConnection(): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  const healthUrl = `${apiConfig.baseURL.replace('/api', '')}/health`;
  
  try {
    console.log(`[Connection Test] Testing connection to ${healthUrl}`);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout for health check
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        success: false,
        message: `Backend responded with status ${response.status}`,
        details: {
          url: healthUrl,
          status: response.status,
          responseTime
        }
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      message: 'Backend connection successful',
      details: {
        url: healthUrl,
        status: response.status,
        responseTime,
        ...data
      }
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('[Connection Test] Failed:', errorMessage);
    
    return {
      success: false,
      message: `Failed to connect to backend: ${errorMessage}`,
      details: {
        url: healthUrl,
        responseTime,
        error: errorMessage
      }
    };
  }
}

/**
 * Test a specific API endpoint
 */
export async function testApiEndpoint(endpoint: string): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  const url = buildUrl(endpoint);
  
  try {
    console.log(`[Connection Test] Testing endpoint ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000)
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        success: false,
        message: `Endpoint responded with status ${response.status}`,
        details: {
          url,
          status: response.status,
          responseTime
        }
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      message: 'Endpoint accessible',
      details: {
        url,
        status: response.status,
        responseTime
      }
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      success: false,
      message: `Failed to access endpoint: ${errorMessage}`,
      details: {
        url,
        responseTime,
        error: errorMessage
      }
    };
  }
}

