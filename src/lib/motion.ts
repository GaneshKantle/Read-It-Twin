import type { Transition, Variants } from 'framer-motion';

export const motionTiming = {
  instant: 0.12,
  fast: 0.2,
  base: 0.32,
  slow: 0.7,
} as const;

/** Rebuild of the source theme's "osmo" curve: slow out, hard settle. */
export const motionEase: [number, number, number, number] = [0.625, 0.05, 0, 1];

/** Stand-in for `elastic.out(1, 0.75)`: overshoots once, then settles. */
export const springPlop: Transition = {
  type: 'spring',
  stiffness: 340,
  damping: 13,
  mass: 0.9,
};

/** Calmer spring for hover and drag follow-through. */
export const springSoft: Transition = {
  type: 'spring',
  stiffness: 220,
  damping: 24,
  mass: 0.6,
};

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

/** Drops in from below with an elastic settle. Used for the step cards. */
export const plopUp: Variants = {
  initial: { opacity: 0, y: 140, rotate: -6 },
  animate: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: springPlop,
  },
};

/** Pops out of nothing with a spin. Used for chips and badges. */
export const plopScale: Variants = {
  initial: { opacity: 0, scale: 0, rotate: -24 },
  animate: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: springPlop,
  },
};

export const sectionViewport = { once: true, amount: 0.25 } as const;

/** Sections are tall, so they only need a sliver on screen to start. */
export const earlyViewport = { once: true, amount: 0.12 } as const;
