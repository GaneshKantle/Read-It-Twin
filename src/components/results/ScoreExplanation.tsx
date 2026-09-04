import { motion } from 'framer-motion';
import { Text } from '@/components/ui/Text';
import { fadeUp } from '@/lib/motion';
import { formatComprehension } from '@/lib/scoring';
import type { PlayerResult } from '@/types/run';

/** The one line that stops the score looking arbitrary. */
export function ScoreExplanation({ player }: { player: PlayerResult }) {
  return (
    <motion.div
      variants={fadeUp}
      className="mt-4 rounded-lg border-2 border-border bg-surface px-5 py-5 sm:px-6"
    >
      <Text as="h2" variant="label" className="text-muted-foreground">
        How that score was made
      </Text>

      <p className="mt-2 text-subheading font-semibold leading-[1.35] tabular-nums">
        {player.wpm} wpm &times; {formatComprehension(player.comprehension)} comprehension
        <br />= {player.finalScore} effective score
      </p>

      <Text as="p" variant="small" className="mt-3 text-muted-foreground">
        Speed only counts for the part you kept.
      </Text>
    </motion.div>
  );
}
