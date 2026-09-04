import { motion } from 'framer-motion';
import { RunOverlay } from '@/components/run/RunOverlay';
import { Text } from '@/components/ui/Text';
import { motionEase } from '@/lib/motion';

export function ScoringOverlay() {
  return (
    <RunOverlay>
      <Text as="p" variant="eyebrow">
        Calculating your run
      </Text>
      <div className="h-px w-32 overflow-hidden bg-border">
        <motion.div
          className="h-px origin-left bg-foreground"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, ease: motionEase }}
        />
      </div>
    </RunOverlay>
  );
}
