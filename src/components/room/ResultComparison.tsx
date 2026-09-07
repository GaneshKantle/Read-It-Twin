import { motion } from 'framer-motion';
import { Text } from '@/components/ui/Text';
import { fadeUp } from '@/lib/motion';
import {
  formatSignedComprehensionPoints,
  formatSignedStat,
} from '@/lib/matchInsights';
import type { ResultComparison } from '@/types/run';

type ResultComparisonStripProps = {
  comparison: ResultComparison;
  outcome: 'win' | 'loss' | 'draw';
};

/**
 * Compact signed diffs for the current player (A minus B).
 * Only shows gaps that are non-zero.
 */
export function ResultComparisonStrip({ comparison, outcome }: ResultComparisonStripProps) {
  const chips: string[] = [];

  if (comparison.wpmDifference !== 0) {
    chips.push(formatSignedStat(comparison.wpmDifference, ' WPM'));
  }
  if (Math.round(comparison.comprehensionDifference) !== 0) {
    chips.push(formatSignedComprehensionPoints(comparison.comprehensionDifference));
  }
  if (comparison.scoreDifference !== 0) {
    chips.push(formatSignedStat(comparison.scoreDifference, ' SCORE'));
  }

  if (chips.length === 0 && outcome !== 'draw') {
    return null;
  }

  return (
    <motion.div variants={fadeUp} className="mt-6">
      <Text as="p" variant="label" className="text-muted-foreground">
        {outcome === 'draw' ? 'Dead even' : 'Your margins'}
      </Text>
      {chips.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Score differences">
          {chips.map((chip) => (
            <li
              key={chip}
              className="rounded-full border-2 border-ink bg-pale-yellow px-3 py-1.5 text-label font-bold tabular-nums text-black"
            >
              {chip}
            </li>
          ))}
        </ul>
      ) : (
        <Text as="p" variant="small" className="mt-2 text-muted-foreground">
          Same effective score.
        </Text>
      )}
    </motion.div>
  );
}
