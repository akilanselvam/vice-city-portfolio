import { useEffect } from 'react';

// While an overlay is open, the page must not scroll or the car would drive off underneath it
export default function useScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [active]);
}
