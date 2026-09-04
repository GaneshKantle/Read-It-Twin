import { motion } from 'framer-motion';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { earlyViewport, fadeUp, motionEase, motionTiming } from '@/lib/motion';
import { formatComprehension } from '@/lib/scoring';
import type { PlayerResult } from '@/types/run';

/**
 * Bars need a top of scale to draw against. These are display ceilings only:
 * the printed figures beside them are the scored ones.
 */
const SPEED_CEILING = 600;
const SCORE_CEILING = 600;

function clampRatio(value: number, ceiling: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.min(1, value / ceiling);
}

function BreakdownRow({
  label,
  value,
  ratio,
  tone,
}: {
  label: string;
  value: string;
  ratio: number;
  tone: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <Text as="dt" variant="label" className="text-muted-foreground">
          {label}
        </Text>
        <dd className="font-display text-lg font-extrabold tracking-[-0.02em] tabular-nums">
          {value}
        </dd>
      </div>

      <div
        aria-hidden="true"
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border/60"
      >
        <motion.div
          className={cn('h-2 origin-left rounded-full', tone)}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: ratio }}
          viewport={earlyViewport}
          transition={{ duration: motionTiming.slow, ease: motionEase }}
        />
      </div>
    </div>
  );
}

/** Speed, then comprehension, then what the two of them add up to. */
export function ScoreBreakdown({ player }: { player: PlayerResult }) {
  return (
    <motion.section variants={fadeUp} className="mt-8" aria-labelledby="breakdown-label">
      <Text as="h2" id="breakdown-label" variant="label" className="text-muted-foreground">
        The breakdown
      </Text>

      <dl className="mt-4 grid gap-5 rounded-lg border-2 border-border bg-surface px-5 py-5 sm:px-6">
        <BreakdownRow
          label="Reading speed"
          value={`${player.wpm} wpm`}
          ratio={clampRatio(player.wpm, SPEED_CEILING)}
          tone="bg-cyan"
        />
        <BreakdownRow
          label="Comprehension"
          value={formatComprehension(player.comprehension)}
          ratio={clampRatio(player.comprehension, 100)}
          tone="bg-pink"
        />
        <BreakdownRow
          label="Effective score"
          value={String(player.finalScore)}
          ratio={clampRatio(player.finalScore, SCORE_CEILING)}
          tone="bg-accent"
        />
      </dl>
    </motion.section>
  );
}
