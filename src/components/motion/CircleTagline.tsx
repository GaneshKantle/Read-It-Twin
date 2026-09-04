import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface CircleTaglineProps {
  text: string;
  className?: string;
  /** Seconds per full rotation. */
  duration?: number;
}

/** Slowly turning ring of type, used as a stamp on the darker sections. */
export function CircleTagline({ text, className, duration = 24 }: CircleTaglineProps) {
  const pathId = useId().replace(/:/g, '');
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className={cn('h-full w-full', className)}
      animate={prefersReducedMotion ? undefined : { rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      <defs>
        <path id={pathId} d="M 100 100 m -74 0 a 74 74 0 1 1 148 0 a 74 74 0 1 1 -148 0" fill="none" />
      </defs>
      <text
        fill="currentColor"
        className="font-sans text-[15px] font-bold uppercase"
        letterSpacing="2.5"
      >
        <textPath href={`#${pathId}`}>{text}</textPath>
      </text>
    </motion.svg>
  );
}
