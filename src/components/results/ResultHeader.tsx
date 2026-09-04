import { motion } from 'framer-motion';
import { Text } from '@/components/ui/Text';
import { resultStagger } from '@/components/results/resultMotion';
import { fadeUp } from '@/lib/motion';
import type { ResultOutcome } from '@/types/run';

/** Only `solo` is reachable today; the rest are here so a match can reuse this. */
const headlines: Record<ResultOutcome, string> = {
  solo: "You're done.",
  win: 'You won.',
  loss: 'You lost.',
  draw: 'Dead even.',
};

interface ResultHeaderProps {
  outcome: ResultOutcome;
  passageTitle: string;
  meta: string;
}

export function ResultHeader({ outcome, passageTitle, meta }: ResultHeaderProps) {
  return (
    <motion.header variants={resultStagger}>
      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink px-4 py-1.5 text-label font-bold text-background">
          Your run
        </span>
      </motion.div>

      <motion.h1
        variants={fadeUp}
        className="mt-7 font-display text-[clamp(2.75rem,9vw,5rem)] font-extrabold leading-[0.86] tracking-[-0.035em]"
      >
        {headlines[outcome]}
      </motion.h1>

      <motion.div variants={fadeUp} className="mt-4">
        <Text as="p" variant="subheading">
          {passageTitle}
        </Text>
        <Text as="p" variant="small" className="mt-1.5 font-semibold text-muted-foreground">
          {meta}
        </Text>
      </motion.div>
    </motion.header>
  );
}
