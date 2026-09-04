import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { fadeUp } from '@/lib/motion';

interface ResultActionsProps {
  onRunItBack: () => void;
  onNewRun: () => void;
  /** A run is already starting; both routes are one-shot. */
  busy: boolean;
}

export function ResultActions({ onRunItBack, onNewRun, busy }: ResultActionsProps) {
  return (
    <motion.div variants={fadeUp} className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          arrow
          className="w-full sm:w-auto"
          disabled={busy}
          onClick={onRunItBack}
        >
          Run it back
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="w-full sm:w-auto"
          disabled={busy}
          onClick={onNewRun}
        >
          New run
        </Button>
      </div>

      <Text as="p" variant="small" className="mt-3 text-muted-foreground">
        Run it back keeps this difficulty and category. New run lets you change them.
      </Text>
    </motion.div>
  );
}
