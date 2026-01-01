/**
 * Global Data Cache Context
 * Provides persistent state for stories and journeys across tab switches
 * Prevents unnecessary refetching when navigating between pages
 */

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

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
  id: number;
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

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export function DataCacheProvider({ children }: { children: ReactNode }) {
  const [stories, setStoriesState] = useState<Story[]>([]);
  const [storiesLastFetched, setStoriesLastFetched] = useState<number | null>(null);

  const [posts, setPostsState] = useState<Post[]>([]);
  const [postsLastFetched, setPostsLastFetched] = useState<number | null>(null);

  const [journeys, setJourneysState] = useState<Journey[]>([]);
  const [journeysLastFetched, setJourneysLastFetched] = useState<number | null>(null);

  const setStories = useCallback((newStories: Story[]) => {
    setStoriesState(newStories);
    setStoriesLastFetched(Date.now());
  }, []);

  const shouldRefetchStories = useCallback(() => {
    if (!storiesLastFetched) return true;
    return Date.now() - storiesLastFetched > CACHE_DURATION;
  }, [storiesLastFetched]);

  const setPosts = useCallback((newPosts: Post[]) => {
    setPostsState(newPosts);
    setPostsLastFetched(Date.now());
  }, []);

  const shouldRefetchPosts = useCallback(() => {
    if (!postsLastFetched) return true;
    return Date.now() - postsLastFetched > CACHE_DURATION;
  }, [postsLastFetched]);

  const setJourneys = useCallback((newJourneys: Journey[]) => {
    setJourneysState(newJourneys);
    setJourneysLastFetched(Date.now());
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
