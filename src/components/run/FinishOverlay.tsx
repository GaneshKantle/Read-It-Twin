import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { RunOverlay } from '@/components/run/RunOverlay';
import { motionEase, motionTiming } from '@/lib/motion';

export function FinishOverlay() {
  return (
    <RunOverlay>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: motionTiming.fast, ease: motionEase }}
        className="flex items-center gap-3"
      >
        <Check className="h-6 w-6 text-accent sm:h-7 sm:w-7" />
        <span className="font-display text-3xl uppercase tracking-[-0.03em] sm:text-5xl">
          Finished
        </span>
      </motion.div>
    </RunOverlay>
  );
}
