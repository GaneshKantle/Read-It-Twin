import { useEffect } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from 'framer-motion';

/**
 * Smooth scrolling for the marketing routes. The run screens deliberately opt
 * out so the passage scrolls at native speed while the clock is running.
 */
export function useSmoothScroll(enabled = true) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled || prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.2,
      autoRaf: true,
      anchors: true,
    });

    return () => {
      lenis.destroy();
    };
  }, [enabled, prefersReducedMotion]);
}
