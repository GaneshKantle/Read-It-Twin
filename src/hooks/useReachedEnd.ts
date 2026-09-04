import { useEffect, useRef, useState } from 'react';

/**
 * Watches a sentinel placed after the last paragraph. Once it has been seen the
 * result latches, so scrolling back up does not un-finish the passage.
 */
export function useReachedEnd<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [reached, setReached] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node || reached) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReached(true);
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [reached]);

  return { ref, reached };
}
