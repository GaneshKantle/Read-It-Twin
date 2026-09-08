import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { motionEase, motionTiming } from '@/lib/motion';

export function PageTransition({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTiming.base, ease: motionEase }}
    >
      {children}
    </motion.div>
  );
}
