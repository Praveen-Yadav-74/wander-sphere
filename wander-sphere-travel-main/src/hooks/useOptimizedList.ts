import { useCallback, useEffect, useRef, useState } from 'react';

interface UseOptimizedListOptions {
  itemHeight?: number;
  overscan?: number;
  scrollDelay?: number;
}

interface UseOptimizedListResult<T> {
  visibleItems: T[];
  containerProps: {
    ref: React.RefObject<HTMLDivElement>;
    style: React.CSSProperties;
  };
  itemProps: (index: number) => {
    style: React.CSSProperties;
    'data-index': number;
  };
}

/**
 * Custom hook for optimizing list rendering by only rendering visible items
 */
export function useOptimizedList<T>(
  items: T[],
  options: UseOptimizedListOptions = {}
): UseOptimizedListResult<T> {
  const {
    itemHeight = 50,
    overscan = 3,
    scrollDelay = 100,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  // Refined: Using a more portable type for the timeout ID
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const startIndex = Math.max(0, Math.floor(container.scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(items.length - 1, Math.ceil((container.scrollTop + container.clientHeight) / itemHeight) + overscan);

    setVisibleRange({ start: startIndex, end: endIndex });
  }, [items.length, itemHeight, overscan]);

  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(calculateVisibleRange, scrollDelay);
  }, [calculateVisibleRange, scrollDelay]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    calculateVisibleRange(); // Initial calculation
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', calculateVisibleRange);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', calculateVisibleRange);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [calculateVisibleRange, handleScroll]);
  
  const visibleItems = items.slice(visibleRange.start, visibleRange.end + 1);

  const containerProps = {
    ref: containerRef,
    style: {
      position: 'relative',
      height: `${items.length * itemHeight}px`,
    } as React.CSSProperties,
  };

  const itemProps = useCallback(
  (index: number) => ({
    style: {
      position: 'absolute',
      top: `${(visibleRange.start + index) * itemHeight}px`,
      height: `${itemHeight}px`,
      width: '100%',
    } as React.CSSProperties, // Add this type assertion
    'data-index': visibleRange.start + index,
  }),
  [visibleRange.start, itemHeight]
);

  return {
    visibleItems,
    containerProps,
    itemProps,
  };
}


/**
 * Custom hook for implementing infinite scrolling with optimized rendering
 */
export function useInfiniteScroll(
  fetchMore: () => void,
  hasMore: boolean,
  options: { threshold?: number; loadingDelay?: number } = {}
) {
  const { threshold = 200, loadingDelay = 500 } = options;
  const [loading, setLoading] = useState(false);
  // Refined: Using a more portable type for the timeout ID
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const currentLoadingRef = loadingRef.current;
    if (!currentLoadingRef) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loading) {
          setLoading(true);
          
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
          
          loadingTimeoutRef.current = setTimeout(() => {
            fetchMore();
            setLoading(false); // Assumes fetchMore is synchronous or manages its own state
            loadingTimeoutRef.current = null;
          }, loadingDelay);
        }
      },
      {
        rootMargin: `0px 0px ${threshold}px 0px`,
      }
    );

    observerRef.current.observe(currentLoadingRef);

    return () => {
      if (observerRef.current && currentLoadingRef) {
        observerRef.current.unobserve(currentLoadingRef);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [fetchMore, hasMore, loading, threshold, loadingDelay]);

  return { loading, loadingRef };
}