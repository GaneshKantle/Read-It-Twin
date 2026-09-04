import type { Variants } from 'framer-motion';
import { motionEase, motionTiming } from '@/lib/motion';

/**
 * The shared stagger runs quick enough for a marketing section. A result is
 * read once and should land block by block, so this one breathes a little
 * longer without inventing new easing.
 */
export const resultStagger: Variants = {
  initial: {},
  animate: {
    transition: {
      delayChildren: 0.06,
      staggerChildren: 0.12,
    },
  },
};

/** Same rise as `fadeUp`, tightened for tiles nested inside a block. */
export const resultTile: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTiming.base,
      ease: motionEase,
    },
  },
};
