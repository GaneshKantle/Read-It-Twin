import { ArrowRight, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/layout/Container';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { fadeUp, lineReveal, staggerContainer } from '@/lib/motion';

// The font-size class must precede `leading-*`, otherwise tailwind-merge drops the line height.
const heroType =
  'font-display uppercase tracking-[-0.045em] text-[clamp(5rem,22vw,11.5rem)] leading-[0.82]';

const heroIndex = [
  { term: 'Speed', detail: 'Words per minute' },
  { term: 'Comprehension', detail: 'Answers that land' },
  { term: 'Rivalry', detail: 'One winner only' },
];

const tagline = ['Two people', 'One passage', 'One winner'];

export function Hero() {
  return (
    <section className="relative">
      <Container>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="pt-8 sm:pt-12 lg:pt-16"
        >
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-between gap-4 border-t border-border pt-4"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Text as="span" variant="eyebrow">
                Reading
              </Text>
              <span aria-hidden="true" className="text-muted-foreground/50">
                /
              </span>
              <Text as="span" variant="eyebrow">
                Competition
              </Text>
            </div>
            <Text as="span" variant="eyebrow" className="text-foreground">
              01
            </Text>
          </motion.div>

          <h1 className={cn('mt-8 sm:mt-12', heroType)}>
            <span className="sr-only">Read It Twin</span>
            <span aria-hidden="true" className="block">
              <span className="block overflow-hidden pb-[0.05em]">
                <motion.span variants={lineReveal} className="block">
                  Read
                </motion.span>
              </span>
              <span className="flex items-center gap-5 overflow-hidden pb-[0.05em] sm:gap-8">
                <motion.span variants={lineReveal} className="block">
                  It
                </motion.span>
                <motion.span variants={fadeUp} className="hidden h-px flex-1 bg-border sm:block" />
                <motion.span
                  variants={fadeUp}
                  className="hidden shrink-0 font-sans text-eyebrow uppercase leading-none tracking-[0.22em] text-muted-foreground sm:block"
                >
                  Two readers
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.05em]">
                <motion.span variants={lineReveal} className="block">
                  Twin
                </motion.span>
              </span>
            </span>
          </h1>

          <div className="mt-10 grid gap-10 border-t border-border pt-8 sm:mt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <motion.div variants={fadeUp} className="space-y-1">
                <Text as="p" variant="subheading" className="text-xl sm:text-2xl">
                  Read faster.
                </Text>
                <Text as="p" variant="subheading" className="text-xl text-muted-foreground sm:text-2xl">
                  Understand better.
                </Text>
                <Text as="p" variant="subheading" className="text-xl sm:text-2xl">
                  Beat your friends.
                </Text>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Reading
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Challenge a Friend
                  <Swords className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>

            <motion.dl variants={fadeUp} className="self-end">
              {heroIndex.map((item) => (
                <div
                  key={item.term}
                  className="flex items-baseline justify-between gap-6 border-b border-border/70 py-3 last:border-b-0"
                >
                  <dt>
                    <Text as="span" variant="label" className="text-foreground">
                      {item.term}
                    </Text>
                  </dt>
                  <dd>
                    <Text as="span" variant="eyebrow">
                      {item.detail}
                    </Text>
                  </dd>
                </div>
              ))}
            </motion.dl>
          </div>

          <motion.div
            variants={fadeUp}
            className="mt-12 flex flex-col gap-2 border-t border-border py-5 sm:mt-16 sm:flex-row sm:items-center sm:gap-6"
          >
            {tagline.map((line, index) => (
              <div key={line} className="flex items-center gap-6">
                {index > 0 && (
                  <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-border sm:block" />
                )}
                <Text as="span" variant="eyebrow" className="text-foreground">
                  {line}
                </Text>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
