import { motion } from 'framer-motion';
import { Text } from '@/components/ui/Text';
import { resultStagger } from '@/components/results/resultMotion';
import { fadeUp, plopScale } from '@/lib/motion';
import { formatComprehension } from '@/lib/scoring';
import type { RecordEvaluation, RecordKind } from '@/lib/records';
import type { PlayerResult } from '@/types/run';

const recordLabels: Record<RecordKind, string> = {
  wpm: 'New speed record',
  comprehension: 'New comprehension record',
  score: 'New score record',
};

function recordValue(kind: RecordKind, player: PlayerResult): string {
  if (kind === 'wpm') {
    return `${player.wpm} wpm`;
  }

  if (kind === 'comprehension') {
    return formatComprehension(player.comprehension);
  }

  return String(player.finalScore);
}

interface PersonalRecordProps {
  evaluation: RecordEvaluation;
  player: PlayerResult;
}

/**
 * Answers "did I beat myself" every time: a first-run note, the records this
 * run broke, or the bests still standing. Stored on this device only.
 */
export function PersonalRecord({ evaluation, player }: PersonalRecordProps) {
  if (evaluation.firstRun) {
    return (
      <motion.section variants={fadeUp} className="mt-4" aria-labelledby="record-label">
        <div className="rounded-lg border-2 border-ink bg-lime px-5 py-4 text-black">
          <Text as="h2" id="record-label" variant="label" className="text-black/65">
            First run complete
          </Text>
          <p className="mt-1.5 text-body font-semibold">
            This one becomes the mark to beat on this device.
          </p>
        </div>
      </motion.section>
    );
  }

  if (evaluation.breaks.length > 0) {
    return (
      <motion.section variants={fadeUp} className="mt-4" aria-labelledby="record-label">
        <Text as="h2" id="record-label" variant="label" className="text-muted-foreground">
          New personal record
        </Text>

        <motion.ul variants={resultStagger} className="mt-3 grid gap-3 sm:grid-cols-3">
          {evaluation.breaks.map((kind) => (
            <motion.li
              key={kind}
              variants={plopScale}
              className="rounded-lg border-2 border-ink bg-lime px-5 py-4 text-black"
            >
              <p className="text-eyebrow font-bold text-black/65">{recordLabels[kind]}</p>
              <p className="mt-1.5 font-display text-2xl font-extrabold tracking-[-0.03em] tabular-nums">
                {recordValue(kind, player)}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </motion.section>
    );
  }

  return (
    <motion.section variants={fadeUp} className="mt-4" aria-labelledby="record-label">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border-2 border-border bg-surface px-5 py-4">
        <Text as="h2" id="record-label" variant="label" className="text-muted-foreground">
          Still your best
        </Text>
        <p className="text-body font-semibold tabular-nums">
          {evaluation.records.bestScore} score / {evaluation.records.bestWpm} wpm
        </p>
      </div>
    </motion.section>
  );
}
