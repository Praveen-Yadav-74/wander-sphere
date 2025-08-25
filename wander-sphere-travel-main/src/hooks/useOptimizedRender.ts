import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Custom hook for optimizing rendering of components that depend on expensive calculations
 * @param value The value to memoize
 * @param deps The dependencies to watch for changes
 * @returns The memoized value
 */
export function useOptimizedValue<T>(value: T, deps: React.DependencyList): T {
  const ref = useRef<T>(value);
  
  useEffect(() => {
    ref.current = value;
  }, deps);
  
  return ref.current;
}

/**
 * Custom hook for optimizing rendering of components that depend on expensive calculations
 * @param fn The function to memoize
 * @param deps The dependencies to watch for changes
 * @returns The memoized function
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  fn: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef<T>(fn);
  
  useEffect(() => {
    callbackRef.current = fn;
  }, [fn]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((...args: any[]) => callbackRef.current(...args), deps) as T;
}

/**
 * Custom hook for optimizing rendering of components that depend on expensive calculations
 * @param initialState The initial state
 * @returns A tuple containing the state and a function to update it with debouncing
 */
export function useDebouncedState<T>(
  initialState: T,
  delay: number = 300
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initialState);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedSetState = useCallback((value: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setState(value);
      timeoutRef.current = null;
    }, delay);
  }, [delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return [state, debouncedSetState];
}

/**
 * Custom hook for optimizing rendering of components that depend on expensive calculations
 * @param initialState The initial state
 * @returns A tuple containing the state and a function to update it with throttling
 */
export function useThrottledState<T>(
  initialState: T,
  limit: number = 300
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initialState);
  const lastRun = useRef<number>(Date.now());
  const throttledValue = useRef<T | null>(null);
  
  const throttledSetState = useCallback((value: T) => {
    throttledValue.current = value;
    
    const now = Date.now();
    if (now - lastRun.current >= limit) {
      setState(value);
      lastRun.current = now;
      throttledValue.current = null;
    } else if (!throttledValue.current) {
      setTimeout(() => {
        if (throttledValue.current) {
          setState(throttledValue.current);
          lastRun.current = Date.now();
          throttledValue.current = null;
        }
      }, limit - (now - lastRun.current));
    }
  }, [limit]);
  
  return [state, throttledSetState];
}