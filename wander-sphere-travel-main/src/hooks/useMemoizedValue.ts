import { useMemo, useRef, useEffect } from 'react';

/**
 * Custom hook for memoizing expensive calculations with dependency tracking
 * @param factory Function that returns the value to be memoized
 * @param deps Dependency array that determines when to recalculate the value
 * @returns Memoized value
 */
export function useMemoizedValue<T>(factory: () => T, deps: React.DependencyList): T {
  return useMemo(factory, deps);
}

/**
 * Custom hook for memoizing the previous value of a variable
 * @param value The current value
 * @returns The previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * Custom hook for deep comparison of objects to prevent unnecessary re-renders
 * @param value The value to memoize
 * @param compare Custom comparison function (optional)
 * @returns Memoized value that only changes when deep comparison detects a change
 */
export function useDeepMemoize<T>(value: T, compare?: (a: T, b: T) => boolean): T {
  const ref = useRef<T>(value);
  
  const isEqual = compare || ((a: T, b: T) => {
    if (a === b) return true;
    
    // Simple deep comparison for objects and arrays
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
      return a === b;
    }
    
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => {
      const valA = (a as any)[key];
      const valB = (b as any)[key];
      
      if (typeof valA === 'object' && typeof valB === 'object') {
        return isEqual(valA, valB);
      }
      
      return valA === valB;
    });
  });
  
  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }
  
  return ref.current;
}