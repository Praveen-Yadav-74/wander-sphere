/**
 * Global Data Cache Context
 * Provides persistent state for stories and journeys across tab switches
 * Prevents unnecessary refetching when navigating between pages
 * 
 * Features:
 * - 5-minute cache duration for all data types
 * - Persists data across page refreshes and tab switches using sessionStorage
 * - Prevents unnecessary API calls when data is fresh
 * - Integrates with React Query for optimal performance
 * - Works like Instagram/Facebook - no reloads on tab switch!
 */

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

interface Story {
  id: string;
  user: string;
  avatar: string;
  media: string;
  timestamp?: string;
  viewed?: boolean;
  isOwn?: boolean;
  hasStory?: boolean;
}

interface Post {
  id: string;
  user: string;
  avatar: string;
  location: string;
  time: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
  hasMultipleImages?: boolean;
  hasVideo?: boolean;
}

interface Journey {
  id: string;
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  images: string[];
  [key: string]: any;
}

interface DataCacheContextType {
  // Stories
  stories: Story[];
  storiesLastFetched: number | null;
  setStories: (stories: Story[]) => void;
  shouldRefetchStories: () => boolean;

  // Posts
  posts: Post[];
  postsLastFetched: number | null;
  setPosts: (posts: Post[]) => void;
  shouldRefetchPosts: () => boolean;

  // Journeys
  journeys: Journey[];
  journeysLastFetched: number | null;
  setJourneys: (journeys: Journey[]) => void;
  shouldRefetchJourneys: () => boolean;

  // Clear all data (on logout)
  clearAll: () => void;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

// Cache duration: 5 minutes (increased for better UX)
const CACHE_DURATION = 5 * 60 * 1000;

// SessionStorage keys for persistence (survives tab switches but not browser close)
const STORAGE_KEYS = {
  STORIES: 'wandersphere_stories_v2',
  STORIES_TIMESTAMP: 'wandersphere_stories_timestamp_v2',
  POSTS: 'wandersphere_posts_v2',
  POSTS_TIMESTAMP: 'wandersphere_posts_timestamp_v2',
  JOURNEYS: 'wandersphere_journeys_v2',
  JOURNEYS_TIMESTAMP: 'wandersphere_journeys_timestamp_v2',
};

// Helper functions for sessionStorage
const getFromStorage = <T,>(key: string): T | null => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from sessionStorage (${key}):`, error);
    return null;
  }
};

const setToStorage = (key: string, value: any): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to sessionStorage (${key}):`, error);
  }
};

const removeFromStorage = (key: string): void => {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from sessionStorage (${key}):`, error);
  }
};

export function DataCacheProvider({ children }: { children: ReactNode }) {
  // Initialize with data from sessionStorage if available
  const [stories, setStoriesState] = useState<Story[]>(() => {
    const cached = getFromStorage<Story[]>(STORAGE_KEYS.STORIES);
    const timestamp = getFromStorage<number>(STORAGE_KEYS.STORIES_TIMESTAMP);
    
    // Only use cache if it's still fresh
    if (cached && timestamp && Date.now() - timestamp < CACHE_DURATION) {
      console.log('[DataCache] Restored stories from sessionStorage');
      return cached;
    }
    return [];
  });
  
  const [storiesLastFetched, setStoriesLastFetched] = useState<number | null>(() => {
    const timestamp = getFromStorage<number>(STORAGE_KEYS.STORIES_TIMESTAMP);
    return timestamp || null;
  });

  const [posts, setPostsState] = useState<Post[]>(() => {
    const cached = getFromStorage<Post[]>(STORAGE_KEYS.POSTS);
    const timestamp = getFromStorage<number>(STORAGE_KEYS.POSTS_TIMESTAMP);
    
    if (cached && timestamp && Date.now() - timestamp < CACHE_DURATION) {
      console.log('[DataCache] Restored posts from sessionStorage');
      return cached;
    }
    return [];
  });
  
  const [postsLastFetched, setPostsLastFetched] = useState<number | null>(() => {
    const timestamp = getFromStorage<number>(STORAGE_KEYS.POSTS_TIMESTAMP);
    return timestamp || null;
  });

  const [journeys, setJourneysState] = useState<Journey[]>(() => {
    const cached = getFromStorage<Journey[]>(STORAGE_KEYS.JOURNEYS);
    const timestamp = getFromStorage<number>(STORAGE_KEYS.JOURNEYS_TIMESTAMP);
    
    if (cached && timestamp && Date.now() - timestamp < CACHE_DURATION) {
      console.log('[DataCache] Restored journeys from sessionStorage');
      return cached;
    }
    return [];
  });
  
  const [journeysLastFetched, setJourneysLastFetched] = useState<number | null>(() => {
    const timestamp = getFromStorage<number>(STORAGE_KEYS.JOURNEYS_TIMESTAMP);
    return timestamp || null;
  });

  const setStories = useCallback((newStories: Story[]) => {
    const timestamp = Date.now();
    setStoriesState(newStories);
    setStoriesLastFetched(timestamp);
    // Persist to sessionStorage
    setToStorage(STORAGE_KEYS.STORIES, newStories);
    setToStorage(STORAGE_KEYS.STORIES_TIMESTAMP, timestamp);
    console.log('[DataCache] Stories cached - will persist across tab switches');
  }, []);

  const shouldRefetchStories = useCallback(() => {
    if (!storiesLastFetched) return true;
    return Date.now() - storiesLastFetched > CACHE_DURATION;
  }, [storiesLastFetched]);

  const setPosts = useCallback((newPosts: Post[]) => {
    const timestamp = Date.now();
    setPostsState(newPosts);
    setPostsLastFetched(timestamp);
    // Persist to sessionStorage
    setToStorage(STORAGE_KEYS.POSTS, newPosts);
    setToStorage(STORAGE_KEYS.POSTS_TIMESTAMP, timestamp);
    console.log('[DataCache] Posts cached - will persist across tab switches');
  }, []);

  const shouldRefetchPosts = useCallback(() => {
    if (!postsLastFetched) return true;
    return Date.now() - postsLastFetched > CACHE_DURATION;
  }, [postsLastFetched]);

  const setJourneys = useCallback((newJourneys: Journey[]) => {
    const timestamp = Date.now();
    setJourneysState(newJourneys);
    setJourneysLastFetched(timestamp);
    // Persist to sessionStorage
    setToStorage(STORAGE_KEYS.JOURNEYS, newJourneys);
    setToStorage(STORAGE_KEYS.JOURNEYS_TIMESTAMP, timestamp);
    console.log('[DataCache] Journeys cached - will persist across tab switches');
  }, []);

  const shouldRefetchJourneys = useCallback(() => {
    if (!journeysLastFetched) return true;
    return Date.now() - journeysLastFetched > CACHE_DURATION;
  }, [journeysLastFetched]);

  const clearAll = useCallback(() => {
    setStoriesState([]);
    setStoriesLastFetched(null);
    setPostsState([]);
    setPostsLastFetched(null);
    setJourneysState([]);
    setJourneysLastFetched(null);
    
    // Clear sessionStorage
    removeFromStorage(STORAGE_KEYS.STORIES);
    removeFromStorage(STORAGE_KEYS.STORIES_TIMESTAMP);
    removeFromStorage(STORAGE_KEYS.POSTS);
    removeFromStorage(STORAGE_KEYS.POSTS_TIMESTAMP);
    removeFromStorage(STORAGE_KEYS.JOURNEYS);
    removeFromStorage(STORAGE_KEYS.JOURNEYS_TIMESTAMP);
    
    console.log('[DataCache] All cache cleared');
  }, []);

  return (
    <DataCacheContext.Provider
      value={{
        stories,
        storiesLastFetched,
        setStories,
        shouldRefetchStories,
        posts,
        postsLastFetched,
        setPosts,
        shouldRefetchPosts,
        journeys,
        journeysLastFetched,
        setJourneys,
        shouldRefetchJourneys,
        clearAll,
      }}
    >
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (context === undefined) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
}
