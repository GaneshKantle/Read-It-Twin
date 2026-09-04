import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/layout/Container';
import { ScoreCard } from '@/components/landing/ScoreCard';
import { SplitChars } from '@/components/motion/SplitChars';
import { Text } from '@/components/ui/Text';
import { springPlop } from '@/lib/motion';

const players = [
  { name: 'Classyyy', wpm: 347, comprehension: 88, accent: 'bg-magenta', winner: true },
  { name: 'Juno', wpm: 291, comprehension: 94, accent: 'bg-cyan' },
] as const;

export function GamePreview() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="bg-sec-plain pb-16 text-foreground sm:pb-24">
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Text as="h2" variant="heading">
            One passage, two scores
          </Text>
          <SplitChars
            text="Faster does not always win"
            className="font-hand text-hand font-semibold text-violet"
          />
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-6 rounded-lg border-4 border-foreground bg-surface-raised p-8 sm:flex-row sm:gap-10 sm:p-12">
          {players.map((player, index) => (
            <motion.div
              key={player.name}
              initial={
                prefersReducedMotion
                  ? false
                  : { opacity: 0, scale: 0.7, rotate: index === 0 ? -12 : 12 }
              }
              whileInView={{ opacity: 1, scale: 1, rotate: index === 0 ? -3 : 3 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ ...springPlop, delay: index * 0.12 }}
            >
              <ScoreCard {...player} />
            </motion.div>
          ))}
        </div>

        <Text as="p" className="mx-auto mt-6 max-w-[56ch] text-center text-body text-muted-foreground">
          Juno understood more of it. Classyyy still takes the round, because 347 words a minute at
          88 percent beats 291 at 94.
        </Text>
      </Container>
    </section>
  );
}
