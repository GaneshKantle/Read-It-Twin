import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Text } from '@/components/ui/Text';
import { motionEase, motionTiming } from '@/lib/motion';

const SWITCH_MS = 800;

export function FinishOverlay() {
  const [stage, setStage] = useState<'finished' | 'calculating'>('finished');

  useEffect(() => {
    const timeout = window.setTimeout(() => setStage('calculating'), SWITCH_MS);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: motionTiming.fast, ease: motionEase }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {stage === 'finished' ? (
          <motion.div
            key="finished"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: motionTiming.fast, ease: motionEase }}
            className="flex items-center gap-3"
          >
            <Check className="h-6 w-6 text-accent sm:h-7 sm:w-7" />
            <span className="font-display text-3xl uppercase tracking-[-0.03em] sm:text-5xl">
              Finished
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="calculating"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: motionTiming.fast, ease: motionEase }}
            className="flex flex-col items-center gap-4"
          >
            <Text as="p" variant="eyebrow">
              Calculating your run
            </Text>
            <div className="h-px w-32 overflow-hidden bg-border">
              <motion.div
                className="h-px origin-left bg-foreground"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, ease: motionEase }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
