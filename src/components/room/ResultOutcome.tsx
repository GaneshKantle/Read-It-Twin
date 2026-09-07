import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

const headlines = {
  win: 'YOU WIN.',
  loss: 'YOU LOSE.',
  draw: "IT'S A DRAW.",
} as const;

type ResultOutcomeProps = {
  outcome: 'win' | 'loss' | 'draw';
};

export function ResultOutcome({ outcome }: ResultOutcomeProps) {
  return (
    <motion.header variants={fadeUp} className="space-y-5">
      <span className="inline-flex rounded-full bg-ink px-4 py-1.5 text-label font-bold text-background">
        FINAL RESULTS
      </span>
      <h1
        className="font-display text-[clamp(2.75rem,10vw,5rem)] font-extrabold leading-[0.86] tracking-[-0.035em]"
        aria-live="polite"
      >
        {headlines[outcome]}
      </h1>
    </motion.header>
  );
}
