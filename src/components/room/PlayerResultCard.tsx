import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { formatComprehension } from '@/lib/scoring';
import { resultTile } from '@/components/results/resultMotion';
import type { MatchPlayerResult } from '@/types/run';

type PlayerResultCardProps = {
  player: MatchPlayerResult;
  isSelf?: boolean;
  isWinner?: boolean;
  isDraw?: boolean;
  /** Reveal stage: hide later stats until staggered in. */
  showWpm?: boolean;
  showComprehension?: boolean;
  showScore?: boolean;
};

export function PlayerResultCard({
  player,
  isSelf = false,
  isWinner = false,
  isDraw = false,
  showWpm = true,
  showComprehension = true,
  showScore = true,
}: PlayerResultCardProps) {
  const statusLabel = isDraw ? 'Draw' : isWinner ? 'Winner' : null;

  return (
    <motion.article
      variants={resultTile}
      className={cn(
        'rounded-lg border-2 bg-background p-5 sm:p-6',
        isWinner
          ? 'border-4 border-ink shadow-pop'
          : 'border-border bg-surface',
      )}
      aria-label={`${player.nickname}${isSelf ? ' (you)' : ''}${statusLabel ? `, ${statusLabel}` : ''}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {isSelf ? (
          <span className="rounded-full bg-chip px-2.5 py-1 text-[0.7rem] font-bold text-chip-foreground">
            You
          </span>
        ) : null}
        {statusLabel ? (
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[0.7rem] font-bold',
              isWinner ? 'bg-lime text-black' : 'bg-ink text-background',
            )}
          >
            {statusLabel}
          </span>
        ) : null}
      </div>

      <p className="mt-3 font-display text-2xl font-extrabold tracking-[-0.03em] uppercase sm:text-3xl">
        {player.nickname}
      </p>

      <dl className="mt-5 space-y-3">
        {showScore ? (
          <div>
            <dt className="text-eyebrow font-bold text-muted-foreground">Score</dt>
            <dd className="mt-0.5 font-display text-[clamp(2.5rem,8vw,3.5rem)] font-extrabold leading-none tracking-[-0.04em] tabular-nums">
              {player.finalScore}
            </dd>
          </div>
        ) : null}

        {showWpm ? (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-sm font-semibold text-muted-foreground">WPM</dt>
            <dd className="font-display text-xl font-extrabold tabular-nums">{player.wpm}</dd>
          </div>
        ) : null}

        {showComprehension ? (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-sm font-semibold text-muted-foreground">Comprehension</dt>
            <dd className="font-display text-xl font-extrabold tabular-nums">
              {formatComprehension(player.comprehension)}
            </dd>
          </div>
        ) : null}
      </dl>
    </motion.article>
  );
}
