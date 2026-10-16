import { useState, useEffect } from 'react';

/**
 * Custom React Hook for debouncing values (e.g. search inputs)
 * Demonstrates useState, useEffect, and timer cleanup
 */
export function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timer on value/delay change or component unmount
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
