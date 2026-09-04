import { useEffect, useRef } from 'react';
import { AnimatePresence, useScroll } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { Countdown } from '@/components/run/Countdown';
import { FinishOverlay } from '@/components/run/FinishOverlay';
import { ReadingBar } from '@/components/run/ReadingBar';
import { readingShell } from '@/components/run/readingLayout';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { categoryLabel, difficultyLabel } from '@/data/runOptions';
import { useElapsedTime } from '@/hooks/useElapsedTime';
import { useReachedEnd } from '@/hooks/useReachedEnd';
import { useRun } from '@/hooks/useRun';
import { useTabFocusGuard } from '@/hooks/useTabFocusGuard';
import { cn } from '@/lib/cn';
import { minimumReadMs } from '@/lib/reading';

/** How long the finish overlay plays before the summary takes over. */
const HANDOFF_MS = 1800;

export function ReadingPage() {
  const navigate = useNavigate();
  const { passage, phase, startedPerf, focusLossCount, beginReading, finishRun, registerFocusLoss } =
    useRun();

  const articleRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: ['start start', 'end end'],
  });

  const elapsedMs = useElapsedTime(startedPerf, phase === 'reading');
  const { ref: endRef, reached } = useReachedEnd<HTMLDivElement>();

  useTabFocusGuard(phase === 'reading', registerFocusLoss);

  useEffect(() => {
    if (phase !== 'finishing') {
      return;
    }

    const timeout = window.setTimeout(() => navigate('/play/finish'), HANDOFF_MS);

    return () => window.clearTimeout(timeout);
  }, [navigate, phase]);

  if (!passage) {
    return <Navigate to="/play" replace />;
  }

  const dwellReached = elapsedMs >= minimumReadMs(passage.wordCount);
  const canFinish = phase === 'reading' && reached && dwellReached;

  const hint = !reached
    ? 'Reach the end to finish'
    : dwellReached
      ? 'Ready when you are'
      : 'No skimming. Give it a few more seconds.';

  return (
    <>
      <ReadingBar
        title={passage.title}
        meta={`${categoryLabel(passage.category)} / ${difficultyLabel(passage.difficulty)}`}
        elapsedMs={elapsedMs}
        progress={scrollYProgress}
      />

      <main className="flex-1">
        <article ref={articleRef} className={cn(readingShell, 'pb-20 pt-10 sm:pb-28 sm:pt-16')}>
          <header>
            <Text as="p" variant="eyebrow">
              {categoryLabel(passage.category)} / {difficultyLabel(passage.difficulty)}
            </Text>
            <h1 className="mt-4 font-display text-[clamp(2rem,6vw,3.25rem)] uppercase leading-[0.95] tracking-[-0.04em]">
              {passage.title}
            </h1>
            <div className="mt-8 h-px w-full bg-border sm:mt-10" />
          </header>

          <div className="mt-8 select-none space-y-6 text-reading leading-[1.75] text-foreground/92 sm:mt-10 sm:space-y-7">
            {passage.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div ref={endRef} aria-hidden="true" className="h-px w-full" />

          <footer className="mt-14 border-t border-border pt-6 sm:mt-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Text as="p" variant="eyebrow" aria-live="polite">
                {hint}
              </Text>
              <Button
                size="lg"
                className="w-full sm:w-auto"
                disabled={!canFinish}
                onClick={finishRun}
              >
                I&apos;m done
              </Button>
            </div>

            {focusLossCount > 0 && (
              <Text as="p" variant="eyebrow" className="mt-4 text-muted-foreground">
                You left the tab {focusLossCount === 1 ? 'once' : `${focusLossCount} times`}. Noted,
                not judged.
              </Text>
            )}
          </footer>
        </article>
      </main>

      <AnimatePresence>
        {phase === 'countdown' && <Countdown key="countdown" onComplete={beginReading} />}
        {phase === 'finishing' && <FinishOverlay key="finish" />}
      </AnimatePresence>
    </>
  );
}
