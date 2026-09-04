import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { RunOverlay } from '@/components/run/RunOverlay';
import { springPlop } from '@/lib/motion';

export function FinishOverlay() {
  return (
    <RunOverlay>
      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={springPlop}
        className="flex items-center gap-4 rounded-full bg-accent px-7 py-4 text-accent-foreground"
      >
        <Check className="h-6 w-6 sm:h-7 sm:w-7" />
        <span className="font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
          Finished
        </span>
      </motion.div>
    </RunOverlay>
  );
}
