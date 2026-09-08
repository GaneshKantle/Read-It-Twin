import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { motionEase, motionTiming } from '@/lib/motion';
import { calculateFinalScore } from '@/lib/scoring';

/** Fastest plausible pace used to scale the speed bars. Visual only. */
const PACE_CEILING = 420;

interface ScoreCardProps {
  name: string;
  wpm: number;
  comprehension: number;
  accent: string;
  winner?: boolean;
  className?: string;
}

/** The little result card the marketing page floats around. Not a live score. */
export function ScoreCard({
  name,
  wpm,
  comprehension,
  accent,
  winner = false,
  className,
}: ScoreCardProps) {
  const score = calculateFinalScore(wpm, comprehension);

  return (
    <div
      className={cn(
        'w-[15rem] rounded-lg border-4 border-ink bg-background p-5 text-foreground shadow-pop',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-label font-bold">{name}</span>
        {winner && (
          <span className="rounded-full bg-lime px-2.5 py-1 text-[0.7rem] font-bold text-black">
            Winner
          </span>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="font-display text-[2.75rem] font-extrabold leading-none tracking-[-0.04em] tabular-nums">
          {score}
        </span>
        <span className="text-label font-bold text-muted-foreground">pts</span>
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-surface-raised">
        <motion.div
          className={cn('h-full rounded-full', accent)}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          style={{ width: `${Math.round((wpm / PACE_CEILING) * 100)}%`, originX: 0 }}
          transition={{ duration: motionTiming.slow, ease: motionEase }}
        />
      </div>

      <dl className="mt-3 flex items-baseline justify-between text-[0.75rem] font-semibold text-muted-foreground">
        <div className="flex gap-1">
          <dt className="sr-only">Speed</dt>
          <dd className="tabular-nums text-foreground">{wpm}</dd>
          <span>wpm</span>
        </div>
        <div className="flex gap-1">
          <dt className="sr-only">Comprehension</dt>
          <dd className="tabular-nums text-foreground">{comprehension}%</dd>
          <span>understood</span>
        </div>
      </dl>
    </div>
  );
}
