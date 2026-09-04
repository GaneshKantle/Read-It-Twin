import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { motionEase, motionTiming } from '@/lib/motion';

/** Full-screen cover used for the moments between run screens. */
export function RunOverlay({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: motionTiming.fast, ease: motionEase }}
    >
      {children}
    </motion.div>
  );
}
