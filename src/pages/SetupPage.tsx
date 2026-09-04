import { useMemo } from 'react';
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

const statTones = ['bg-pale-yellow', 'bg-soft-pink', 'bg-soft-orange'];

function LiveStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-lg border-2 border-ink px-5 py-4 text-black sm:px-6 sm:py-5 ${tone}`}>
      <p className="text-eyebrow font-bold text-black/65">{label}</p>
      <div className="mt-2 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: motionTiming.fast, ease: motionEase }}
            className="font-display text-2xl font-extrabold tracking-[-0.03em] tabular-nums sm:text-3xl"
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
        <Container className="py-8 sm:py-12 lg:py-16">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mx-auto w-full max-w-[54rem]"
          >
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-ink px-4 py-1.5 text-label font-bold text-background">
                Solo run
              </span>
              <span className="rounded-full border-2 border-border px-4 py-1.5 text-label font-bold text-muted-foreground">
                No opponent yet
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-7 font-display text-[clamp(2.75rem,9vw,5rem)] font-extrabold leading-[0.86] tracking-[-0.035em]"
            >
              Set your run
            </motion.h1>

            <motion.section
              variants={fadeUp}
              aria-labelledby="difficulty-label"
              className="mt-10 sm:mt-14"
            >
              <Text as="h2" id="difficulty-label" variant="label" className="text-muted-foreground">
                Difficulty
              </Text>
              <div className="mt-4 flex flex-wrap gap-2.5">
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

            <motion.section variants={fadeUp} aria-labelledby="category-label" className="mt-9">
              <Text as="h2" id="category-label" variant="label" className="text-muted-foreground">
                Category
              </Text>
              <div className="mt-4 flex flex-wrap gap-2.5">
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

            <motion.div variants={fadeUp} className="mt-10 grid gap-3 sm:grid-cols-3">
              <LiveStat
                label="Reading time"
                value={`~${formatMinutes(estimate.readingMs)}`}
                tone={statTones[0]}
              />
              <LiveStat
                label="Length"
                value={`${estimate.wordCount} words`}
                tone={statTones[1]}
              />
              <LiveStat
                label="Questions after"
                value={String(estimate.questionCount)}
                tone={statTones[2]}
              />
            </motion.div>

            {estimate.widened && (
              <Text as="p" variant="small" className="mt-4 font-semibold text-muted-foreground">
                Nothing in that category at this level yet, so you will get another one at the same
                difficulty.
              </Text>
            )}

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <Text as="p" variant="hand">
                The timer starts when the countdown ends
              </Text>
              <Button size="lg" arrow className="w-full sm:w-auto" onClick={handleStart}>
                Run it
              </Button>
            </motion.div>
          </motion.div>
        </Container>
      </main>
    </>
  );
}
