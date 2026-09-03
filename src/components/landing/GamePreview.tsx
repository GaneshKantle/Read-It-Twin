import { motion } from 'framer-motion';
import { Container } from '@/components/layout/Container';
import { CountUp } from '@/components/landing/CountUp';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { fadeUp, motionEase, motionTiming, sectionViewport, staggerContainer } from '@/lib/motion';

/** Fastest plausible pace used to scale the speed bars. Visual only. */
const PACE_CEILING = 400;

interface PlayerResult {
  name: string;
  wpm: number;
  comprehension: number;
  winner?: boolean;
  align?: 'left' | 'right';
}

const players: PlayerResult[] = [
  { name: 'Classyyy', wpm: 347, comprehension: 80, winner: true },
  { name: 'Juno', wpm: 291, comprehension: 90, align: 'right' },
];

function PlayerScore({ name, wpm, comprehension, winner = false, align = 'left' }: PlayerResult) {
  const alignEnd = align === 'right';

  return (
    <div className={cn('px-6 py-8 sm:px-8 sm:py-10', alignEnd && 'sm:text-right')}>
      <div className={cn('flex items-center gap-2', alignEnd && 'sm:justify-end')}>
        {winner && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />}
        <Text as="span" variant="label" className={winner ? 'text-foreground' : 'text-muted-foreground'}>
          {name}
        </Text>
      </div>

      <div className={cn('mt-5 flex items-baseline gap-2', alignEnd && 'sm:justify-end')}>
        <Text as="span" variant="stat">
          <CountUp value={wpm} />
        </Text>
        <Text as="span" variant="eyebrow">
          wpm
        </Text>
      </div>

      <div className="mt-5 h-px w-full bg-border">
        <motion.div
          className={cn(
            'h-px origin-left bg-foreground',
            winner && 'bg-accent',
            alignEnd && 'sm:ml-auto sm:origin-right',
          )}
          style={{ width: `${Math.round((wpm / PACE_CEILING) * 100)}%` }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={sectionViewport}
          transition={{ duration: motionTiming.slow, ease: motionEase }}
        />
      </div>

      <div className={cn('mt-5 flex items-baseline gap-2', alignEnd && 'sm:justify-end')}>
        <Text as="span" variant="subheading" className="tabular-nums">
          <CountUp value={comprehension} />%
        </Text>
        <Text as="span" variant="eyebrow">
          Comprehension
        </Text>
      </div>
    </div>
  );
}

export function GamePreview() {
  return (
    <section className="border-t border-border">
      <Container className="py-14 sm:py-20 lg:py-24">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={sectionViewport}
        >
          <motion.div variants={fadeUp} className="flex items-baseline justify-between gap-4">
            <Text as="p" variant="eyebrow">
              Match preview
            </Text>
            <Text as="p" variant="eyebrow">
              Sample result
            </Text>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-5 border border-border bg-surface">
            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-[1fr_auto_1fr] sm:divide-x sm:divide-y-0">
              <PlayerScore {...players[0]} />
              <div className="flex items-center justify-center px-6 py-3 sm:py-0">
                <Text as="span" variant="eyebrow" className="text-muted-foreground">
                  vs
                </Text>
              </div>
              <PlayerScore {...players[1]} />
            </div>

            <div className="border-t border-border px-6 py-5 text-center sm:px-8">
              <Text as="span" variant="label" className="text-accent">
                Classyyy wins
              </Text>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
