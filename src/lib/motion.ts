import type { Variants } from 'framer-motion';

export const motionTiming = {
  instant: 0.12,
  fast: 0.2,
  base: 0.32,
  slow: 0.7,
} as const;

export const motionEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const pageTransition = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTiming.base,
      ease: motionEase,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: motionTiming.fast,
      ease: motionEase,
    },
  },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      delayChildren: 0.04,
      staggerChildren: 0.08,
    },
  },
};

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTiming.base,
      ease: motionEase,
    },
  },
};

/** Slides a line of type up from behind an overflow-hidden parent. */
export const lineReveal: Variants = {
  initial: { y: '110%' },
  animate: {
    y: '0%',
    transition: {
      duration: motionTiming.slow,
      ease: motionEase,
    },
  },
};

export const sectionViewport = { once: true, amount: 0.25 } as const;
