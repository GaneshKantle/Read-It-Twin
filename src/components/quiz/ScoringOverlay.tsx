import { motion } from 'framer-motion';
import { RunOverlay } from '@/components/run/RunOverlay';
import { Text } from '@/components/ui/Text';
import { motionEase } from '@/lib/motion';

export function ScoringOverlay() {
  return (
    <RunOverlay>
      <Text as="p" variant="hand">
        Calculating your run
      </Text>
      <div className="h-2 w-40 overflow-hidden rounded-full bg-border/60">
        <motion.div
          className="h-2 origin-left rounded-full bg-accent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, ease: motionEase }}
        />
      </div>
    </RunOverlay>
  );
}
