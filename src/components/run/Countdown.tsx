import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Text } from '@/components/ui/Text';
import { motionEase, motionTiming } from '@/lib/motion';

const steps = ['3', '2', '1', 'Read'];
const STEP_MS = 700;

/**
 * Covers the passage completely until the run begins, so nothing can be read
 * before the clock starts.
 */
export function Countdown({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const completed = useRef(false);

  useEffect(() => {
    if (index >= steps.length) {
      if (!completed.current) {
        completed.current = true;
        onComplete();
      }

      return;
    }

    const timeout = window.setTimeout(() => setIndex((current) => current + 1), STEP_MS);

    return () => window.clearTimeout(timeout);
  }, [index, onComplete]);

  const step = steps[Math.min(index, steps.length - 1)];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: motionTiming.fast, ease: motionEase }}
    >
      <Text as="p" variant="eyebrow" className="text-muted-foreground">
        Lock in.
      </Text>

      <div
        aria-live="assertive"
        className="flex h-[1.1em] items-center justify-center font-display uppercase tracking-[-0.05em] text-[clamp(5rem,26vw,14rem)] leading-none"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={step}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: motionTiming.fast, ease: motionEase }}
            className="block"
          >
            {step}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="h-px w-40 overflow-hidden bg-border">
        <motion.div
          className="h-px origin-left bg-foreground"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: (STEP_MS * steps.length) / 1000, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}
