import { useReducedMotion } from 'framer-motion';

interface IdleFloatOptions {
  /** Vertical travel in pixels, applied symmetrically. */
  y?: number;
  /** Tilt in degrees, applied symmetrically. */
  rotate?: number;
  /** One full round trip, in seconds. */
  duration?: number;
  delay?: number;
}

/**
 * Spreads a slow, endless bob across a group of elements. Vary `duration` and
 * `delay` per item so they never drift into lockstep.
 */
export function useIdleFloat({ y = 14, rotate = 4, duration = 6, delay = 0 }: IdleFloatOptions = {}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return {};
  }

  return {
    animate: {
      y: [-y, y, -y],
      rotate: [-rotate, rotate, -rotate],
    },
    transition: {
      duration,
      delay,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  };
}
