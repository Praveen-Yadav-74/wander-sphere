import { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualizedListOptions {
  itemHeight: number;       // Height of each item in pixels
  overscan?: number;        // Number of items to render outside of the visible area
  scrollingDelay?: number;  // Delay in ms before updating visible items while scrolling
}

interface VirtualizedListResult<T> {
  virtualItems: Array<{ index: number; item: T; }>;
  totalHeight: number;
  startIndex: number;
  endIndex: number;
  containerProps: {
    ref: React.RefObject<HTMLDivElement>;
    style: React.CSSProperties;
    onScroll: (event: React.UIEvent) => void;
  };
}

/**
 * Custom hook for virtualizing long lists to improve performance
 * @param items Array of items to virtualize
 * @param options Configuration options
 * @returns Virtualized list data and container props
 */
export function useVirtualizedList<T>(
  items: T[],
  options: VirtualizedListOptions
): VirtualizedListResult<T> {
  const { 
    itemHeight, 
    overscan = 3,
    scrollingDelay = 100
  } = options;
  
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);
  
  // Calculate the range of visible items
  const totalHeight = items.length * itemHeight;
  const visibleStartIndex = Math.floor(scrollTop / itemHeight);
  const visibleEndIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight)
  );
  
  // Add overscan to the visible range
  const startIndex = Math.max(0, visibleStartIndex - overscan);
  const endIndex = Math.min(items.length - 1, visibleEndIndex + overscan);
  
  // Create the list of virtual items
  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      item: items[i],
    });
  }
  
  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent) => {
    const scrollTop = (event.target as HTMLDivElement).scrollTop;
    
    setScrollTop(scrollTop);
    
    if (!isScrolling) {
      setIsScrolling(true);
    }
    
    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
      scrollTimeoutRef.current = null;
    }, scrollingDelay);
  }, [isScrolling, scrollingDelay]);
  
  // Measure the container height on mount and resize
  useEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    updateContainerHeight();
    
    const resizeObserver = new ResizeObserver(updateContainerHeight);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
      
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    containerProps: {
      ref: containerRef,
      style: { height: '100%', overflow: 'auto' },
      onScroll: handleScroll
    }
  };
}