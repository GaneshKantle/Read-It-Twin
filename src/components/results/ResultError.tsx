import { motion } from 'framer-motion';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { fadeUp, staggerContainer } from '@/lib/motion';

/**
 * Shown instead of a silent redirect when there is no run to report, so a
 * missing result reads as a state rather than a bug.
 */
export function ResultError({ onRetry }: { onRetry: () => void }) {
  return (
    <Container className="py-14 sm:py-20">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="mx-auto w-full max-w-[34rem] rounded-lg border-2 border-border bg-surface p-7 sm:p-9"
      >
        <motion.div variants={fadeUp}>
          <Text as="h1" variant="subheading">
            Unable to load your result.
          </Text>
          <Text as="p" variant="small" className="mt-3 text-muted-foreground">
            Nothing from that run is on this device any more. Start a fresh one and it will be
            scored from the top.
          </Text>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-7">
          <Button size="lg" arrow className="w-full sm:w-auto" onClick={onRetry}>
            Try again
          </Button>
        </motion.div>
      </motion.div>
    </Container>
  );
}
