import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, useScroll } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { Countdown } from '@/components/run/Countdown';
import { FinishOverlay } from '@/components/run/FinishOverlay';
import { ReadingBar } from '@/components/run/ReadingBar';
import { readingShell } from '@/components/run/readingLayout';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { categoryLabel, difficultyLabel } from '@/data/runOptions';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useElapsedTime } from '@/hooks/useElapsedTime';
import { useReachedEnd } from '@/hooks/useReachedEnd';
import { useRun } from '@/hooks/useRun';
import { useTabFocusGuard } from '@/hooks/useTabFocusGuard';
import { cn } from '@/lib/cn';
import { readPersonalRecords } from '@/lib/records';
import { minimumReadMs } from '@/lib/reading';

/** How long the finish overlay plays before the quiz takes over. */
const HANDOFF_MS = 1100;

export function ReadingPage() {
  const navigate = useNavigate();
  const { passage, phase, startedPerf, focusLossCount, beginReading, finishRun, registerFocusLoss } =
    useRun();

  useDocumentMeta({
    title: 'Reading · Read It Twin',
    description: 'Read the passage, then prove you understood it.',
    robots: 'noindex,nofollow',
  });

  const articleRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: ['start start', 'end end'],
  });

  const elapsedMs = useElapsedTime(startedPerf, phase === 'reading');
  const { ref: endRef, reached } = useReachedEnd<HTMLDivElement>();

  useTabFocusGuard(phase === 'reading', registerFocusLoss);

  const isFirstRun = useMemo(() => readPersonalRecords().runCount === 0, []);

  useEffect(() => {
    if (phase !== 'finishing') {
      return;
    }

    const timeout = window.setTimeout(() => navigate('/play/quiz'), HANDOFF_MS);

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

      {/* The passage sits on its own quiet pair of surfaces: no blobs, no candy. */}
      <main className="flex-1 bg-reading-page">
        <div className={cn(readingShell, 'pb-16 pt-6 sm:pb-24 sm:pt-10')}>
          <article
            ref={articleRef}
            className="rounded-lg border-2 border-black/10 bg-reading-card px-6 py-10 text-reading-ink shadow-soft sm:px-10 sm:py-14"
          >
            <header>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-yellow px-3.5 py-1.5 text-[0.72rem] font-bold text-black">
                  {categoryLabel(passage.category)}
                </span>
                <span className="rounded-full border border-black/15 px-3.5 py-1.5 text-[0.72rem] font-bold text-black/55">
                  {difficultyLabel(passage.difficulty)}
                </span>
              </div>
              <h1 className="mt-5 font-display text-[clamp(2rem,5.5vw,3rem)] font-extrabold leading-[0.92] tracking-[-0.03em]">
                {passage.title}
              </h1>
              {isFirstRun && phase === 'reading' ? (
                <Text as="p" variant="hand" className="mt-3 text-reading-ink/55">
                  Read normally. Speed isn&apos;t everything.
                </Text>
              ) : null}
            </header>

            <div className="mt-8 select-none space-y-6 text-reading leading-[1.75] text-reading-ink/90 sm:mt-10 sm:space-y-7">
              {passage.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <div ref={endRef} aria-hidden="true" className="h-px w-full" />
          </article>

          <footer className="mt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Text as="p" variant="hand" aria-live="polite">
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
              <Text as="p" variant="small" className="mt-4 font-semibold text-muted-foreground">
                You left the tab {focusLossCount === 1 ? 'once' : `${focusLossCount} times`}. Noted,
                not judged.
              </Text>
            )}
          </footer>
        </div>
      </main>

      <AnimatePresence>
        {phase === 'countdown' && <Countdown key="countdown" onComplete={beginReading} />}
        {phase === 'finishing' && <FinishOverlay key="finish" />}
      </AnimatePresence>
    </>
  );
}
