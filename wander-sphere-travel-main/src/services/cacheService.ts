/**
 * Local storage service for caching API responses
 */

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  version?: string; // Cache version for invalidation
}

class CacheService {
  private readonly prefix = 'wandersphere_cache_';
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly maxCacheSize = 50; // Maximum number of cached items

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    try {
      const { ttl = this.defaultTTL, version = '1.0' } = options;
      const now = Date.now();
      
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        version
      };

      const cacheKey = this.getCacheKey(key);
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      
      // Clean up old cache entries if we exceed max size
      this.cleanupCache();
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  /**
   * Retrieve data from cache
   */
  get<T>(key: string, version = '1.0'): T | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is expired
      if (now > cacheItem.expiresAt) {
        this.remove(key);
        return null;
      }
      
      // Check version compatibility
      if (cacheItem.version !== version) {
        this.remove(key);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  /**
   * Remove specific cache entry
   */
  remove(key: string): void {
    try {
      const cacheKey = this.getCacheKey(key);
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Failed to remove cached data:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Check if data exists in cache and is valid
   */
  has(key: string, version = '1.0'): boolean {
    return this.get(key, version) !== null;
  }

  /**
   * Get cache metadata
   */
  getMetadata(key: string): { timestamp: number; expiresAt: number; version: string } | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const cacheItem: CacheItem = JSON.parse(cached);
      return {
        timestamp: cacheItem.timestamp,
        expiresAt: cacheItem.expiresAt,
        version: cacheItem.version
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if cached data is stale (but not expired)
   */
  isStale(key: string, staleThreshold = 2 * 60 * 1000): boolean {
    const metadata = this.getMetadata(key);
    if (!metadata) return true;
    
    const now = Date.now();
    return (now - metadata.timestamp) > staleThreshold;
  }

  /**
   * Get cache statistics
   */
  getStats(): { totalItems: number; totalSize: number; oldestItem: number | null } {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    let totalSize = 0;
    let oldestTimestamp: number | null = null;
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length;
        try {
          const cacheItem: CacheItem = JSON.parse(value);
          if (!oldestTimestamp || cacheItem.timestamp < oldestTimestamp) {
            oldestTimestamp = cacheItem.timestamp;
          }
        } catch (error) {
          // Ignore invalid cache items
        }
      }
    });
    
    return {
      totalItems: keys.length,
      totalSize,
      oldestItem: oldestTimestamp
    };
  }

  private getCacheKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private cleanupCache(): void {
    try {
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .map(key => {
          const value = localStorage.getItem(key);
          if (!value) return null;
          
          try {
            const cacheItem: CacheItem = JSON.parse(value);
            return { key, timestamp: cacheItem.timestamp, expiresAt: cacheItem.expiresAt };
          } catch {
            return { key, timestamp: 0, expiresAt: 0 };
          }
        })
        .filter(Boolean) as Array<{ key: string; timestamp: number; expiresAt: number }>;

      // Remove expired items first
      const now = Date.now();
      keys.forEach(({ key, expiresAt }) => {
        if (now > expiresAt) {
          localStorage.removeItem(key);
        }
      });

      // If still over limit, remove oldest items
      const validKeys = keys.filter(({ expiresAt }) => now <= expiresAt);
      if (validKeys.length > this.maxCacheSize) {
        validKeys
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, validKeys.length - this.maxCacheSize)
          .forEach(({ key }) => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn('Failed to cleanup cache:', error);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache key generators for different data types
export const CacheKeys = {
  userProfile: (userId: string) => `user_profile_${userId}`,
  userJourneys: (userId: string) => `user_journeys_${userId}`,
  notifications: (userId: string) => `notifications_${userId}`,
  followers: (userId: string) => `followers_${userId}`,
  following: (userId: string) => `following_${userId}`,
  journeyDetail: (journeyId: string) => `journey_detail_${journeyId}`,
  journeyComments: (journeyId: string) => `journey_comments_${journeyId}`,
  tripDetail: (tripId: string) => `trip_detail_${tripId}`,
  tripComments: (tripId: string) => `trip_comments_${tripId}`,
  searchResults: (query: string, type: string) => `search_${type}_${query}`,
  clubs: () => 'clubs_list',
  clubDetail: (clubId: string) => `club_detail_${clubId}`,
  stories: (type: string) => `stories_${type}`,
  storyDetail: (storyId: string) => `story_detail_${storyId}`,
  BOOKING_PARTNERS: 'booking_partners',
  BOOKING_FEATURES: 'booking_features',
};

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
};

export default cacheService;