import { motion } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { CountUp } from '@/components/motion/CountUp';
import { RunTopBar } from '@/components/run/RunTopBar';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { categoryLabel, difficultyLabel } from '@/data/runOptions';
import { useRun } from '@/hooks/useRun';
import { formatClock } from '@/lib/reading';
import { fadeUp, staggerContainer } from '@/lib/motion';

export function RunSummaryPage() {
  const navigate = useNavigate();
  const { result, resetRun } = useRun();

  if (!result) {
    return <Navigate to="/play" replace />;
  }

  const handleRunAgain = () => {
    resetRun();
    navigate('/play');
  };

  const facts = [
    { label: 'Time', value: formatClock(result.durationMs) },
    { label: 'Words', value: String(result.wordCount) },
    {
      label: 'Passage',
      value: `${categoryLabel(result.category)} / ${difficultyLabel(result.difficulty)}`,
    },
  ];

  return (
    <>
      <RunTopBar backTo="/play" backLabel="Set up" />

      <main className="flex-1">
        <Container className="py-10 sm:py-14 lg:py-20">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mx-auto w-full max-w-[52rem]"
          >
            <motion.div
              variants={fadeUp}
              className="flex items-baseline justify-between gap-4 border-b border-border pb-4"
            >
              <Text as="p" variant="eyebrow">
                Run complete
              </Text>
              <Text as="p" variant="eyebrow" className="text-accent">
                You&apos;re cooking.
              </Text>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 flex items-baseline gap-3 sm:mt-14">
              <span className="font-display text-[clamp(4rem,18vw,9rem)] leading-[0.85] tracking-[-0.05em] tabular-nums">
                <CountUp value={Math.round(result.wpm)} />
              </span>
              <Text as="span" variant="eyebrow" className="text-foreground">
                wpm
              </Text>
            </motion.div>

            <motion.dl
              variants={fadeUp}
              className="mt-10 grid grid-cols-1 divide-y divide-border border border-border bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0"
            >
              {facts.map((fact) => (
                <div key={fact.label} className="px-5 py-4 sm:px-6 sm:py-5">
                  <dt>
                    <Text as="span" variant="eyebrow">
                      {fact.label}
                    </Text>
                  </dt>
                  <dd className="mt-2 font-display text-xl tracking-[-0.03em] tabular-nums sm:text-2xl">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </motion.dl>

            <motion.div variants={fadeUp} className="mt-8 border-t border-border pt-6">
              <Text as="p" variant="subheading" className="text-muted-foreground">
                {result.passageTitle}
              </Text>
              <Text as="p" variant="eyebrow" className="mt-4">
                Speed only. Comprehension questions arrive in the next phase, and your score will
                depend on both.
              </Text>
              {result.focusLossCount > 0 && (
                <Text as="p" variant="eyebrow" className="mt-3 text-warning">
                  You left the tab{' '}
                  {result.focusLossCount === 1 ? 'once' : `${result.focusLossCount} times`} during
                  this run.
                </Text>
              )}
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row"
            >
              <Button size="lg" className="w-full sm:w-auto" onClick={handleRunAgain}>
                Run again
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => navigate('/')}
              >
                Back home
              </Button>
            </motion.div>
          </motion.div>
        </Container>
      </main>
    </>
  );
}
