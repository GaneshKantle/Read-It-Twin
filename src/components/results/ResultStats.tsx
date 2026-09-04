import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CountUp } from '@/components/motion/CountUp';
import { resultStagger, resultTile } from '@/components/results/resultMotion';
import { cn } from '@/lib/cn';
import { formatRunTime } from '@/lib/results';
import { formatComprehension } from '@/lib/scoring';
import type { PlayerResult } from '@/types/run';

function StatTile({
  label,
  tone,
  span,
  emphasis = false,
  children,
}: {
  label: string;
  tone: string;
  span: string;
  emphasis?: boolean;
  children: ReactNode;
}) {
  return (
    <motion.div
      variants={resultTile}
      className={cn('rounded-lg border-2 border-ink px-5 py-4 text-black', tone, span)}
    >
      <dt className="text-eyebrow font-bold text-black/65">{label}</dt>
      <dd
        className={cn(
          'mt-1.5 font-display font-extrabold tracking-[-0.03em] tabular-nums',
          emphasis ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl',
        )}
      >
        {children}
      </dd>
    </motion.div>
  );
}

/**
 * The whole run in one glance, ordered so the smallest screen still answers
 * score, then speed, then comprehension before anything else.
 */
export function ResultStats({ player }: { player: PlayerResult }) {
  return (
    <motion.dl variants={resultStagger} className="mt-8 grid grid-cols-2 gap-3 sm:mt-10">
      <motion.div
        variants={resultTile}
        className="col-span-2 rounded-lg border-2 border-ink bg-yellow p-6 text-black sm:p-9"
      >
        <dt className="text-eyebrow font-bold text-black/65">Effective score</dt>
        <dd className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <span className="font-display text-[clamp(4.5rem,18vw,9rem)] font-extrabold leading-[0.82] tracking-[-0.05em] tabular-nums">
            <CountUp value={player.finalScore} />
          </span>
          <span className="text-label font-bold text-black/65">
            {player.wpm} wpm at {formatComprehension(player.comprehension)}
          </span>
        </dd>
      </motion.div>

      <StatTile label="Words per minute" tone="bg-cyan" span="col-span-2 sm:col-span-1" emphasis>
        <CountUp value={player.wpm} />
      </StatTile>

      <StatTile label="Comprehension" tone="bg-soft-pink" span="col-span-2 sm:col-span-1" emphasis>
        {formatComprehension(player.comprehension)}
      </StatTile>

      <StatTile label="Reading time" tone="bg-pale-yellow" span="col-span-1">
        {formatRunTime(player.readingTime)}
      </StatTile>

      <StatTile label="Questions" tone="bg-soft-orange" span="col-span-1">
        {player.correctAnswers} / {player.totalQuestions}
      </StatTile>
    </motion.dl>
  );
}
