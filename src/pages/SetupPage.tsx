import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { OptionChip } from '@/components/run/OptionChip';
import { RunTopBar } from '@/components/run/RunTopBar';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { getPoolEstimate } from '@/data/passages';
import { categoryOptions, difficultyOptions } from '@/data/runOptions';
import { useRun } from '@/hooks/useRun';
import { formatMinutes } from '@/lib/reading';
import { fadeUp, motionEase, motionTiming, staggerContainer } from '@/lib/motion';

function LiveStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4 sm:px-6 sm:py-5">
      <Text as="p" variant="eyebrow">
        {label}
      </Text>
      <div className="mt-2 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: motionTiming.fast, ease: motionEase }}
            className="font-display text-2xl tracking-[-0.03em] tabular-nums sm:text-3xl"
          >
            {value}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function SetupPage() {
  const navigate = useNavigate();
  const { config, setDifficulty, setCategory, startRun } = useRun();

  const estimate = useMemo(
    () => getPoolEstimate(config.difficulty, config.category),
    [config.category, config.difficulty],
  );

  const handleStart = () => {
    startRun();
    navigate('/play/read');
  };

  return (
    <>
      <RunTopBar backTo="/" backLabel="Back" />

      <main className="flex-1">
        <Container className="py-10 sm:py-14 lg:py-20">
          <motion.div variants={staggerContainer} initial="initial" animate="animate">
            <motion.div
              variants={fadeUp}
              className="flex items-baseline justify-between gap-4 border-b border-border pb-4"
            >
              <Text as="p" variant="eyebrow">
                Solo run
              </Text>
              <Text as="p" variant="eyebrow">
                No opponent yet
              </Text>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-8 font-display uppercase tracking-[-0.045em] text-[clamp(2.75rem,11vw,6.5rem)] leading-[0.9] sm:mt-10"
            >
              Set your run
            </motion.h1>

            <motion.section
              variants={fadeUp}
              aria-labelledby="difficulty-label"
              className="mt-12 grid gap-4 border-t border-border pt-6 sm:mt-16 sm:grid-cols-[9rem_1fr] sm:gap-8"
            >
              <Text as="h2" id="difficulty-label" variant="label" className="text-muted-foreground">
                Difficulty
              </Text>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {difficultyOptions.map((option) => (
                  <OptionChip
                    key={option.value}
                    label={option.label}
                    hint={option.hint}
                    selected={config.difficulty === option.value}
                    onSelect={() => setDifficulty(option.value)}
                    indicatorId="difficulty-indicator"
                  />
                ))}
              </div>
            </motion.section>

            <motion.section
              variants={fadeUp}
              aria-labelledby="category-label"
              className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-[9rem_1fr] sm:gap-8"
            >
              <Text as="h2" id="category-label" variant="label" className="text-muted-foreground">
                Category
              </Text>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {categoryOptions.map((option) => (
                  <OptionChip
                    key={option.value}
                    label={option.label}
                    selected={config.category === option.value}
                    onSelect={() => setCategory(option.value)}
                    indicatorId="category-indicator"
                  />
                ))}
              </div>
            </motion.section>

            <motion.div
              variants={fadeUp}
              className="mt-10 grid grid-cols-1 divide-y divide-border border border-border bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0"
            >
              <LiveStat label="Reading time" value={`~${formatMinutes(estimate.readingMs)}`} />
              <LiveStat label="Length" value={`${estimate.wordCount} words`} />
              <LiveStat label="Questions after" value={String(estimate.questionCount)} />
            </motion.div>

            {estimate.widened && (
              <Text as="p" variant="eyebrow" className="mt-3 text-muted-foreground">
                Nothing in that category at this level yet, so you will get another one at the same
                difficulty.
              </Text>
            )}

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <Text as="p" variant="eyebrow">
                Timer starts when the countdown ends
              </Text>
              <Button size="lg" className="w-full sm:w-auto" onClick={handleStart}>
                Run it
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </Container>
      </main>
    </>
  );
}
