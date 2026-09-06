import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, useScroll } from 'framer-motion';
import { Countdown } from '@/components/run/Countdown';
import { FinishOverlay } from '@/components/run/FinishOverlay';
import { ReadingBar } from '@/components/run/ReadingBar';
import { readingShell } from '@/components/run/readingLayout';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { categoryLabel, difficultyLabel } from '@/data/runOptions';
import { useRaceElapsed } from '@/hooks/useRaceElapsed';
import { useReachedEnd } from '@/hooks/useReachedEnd';
import { useTabFocusGuard } from '@/hooks/useTabFocusGuard';
import { cn } from '@/lib/cn';
import { minimumReadMs } from '@/lib/reading';
import type { MatchRow, PlayerRow } from '@/types/database';
import type { MatchView } from '@/types/match';
import type { Passage } from '@/types/run';

type MatchReadingScreenProps = {
  view: MatchView;
  passage: Passage;
  match: MatchRow;
  selfPlayer: PlayerRow;
  opponent: PlayerRow | null;
  clockOffsetMs: number;
  focusLossCount: number;
  finishPending: boolean;
  actionError: string | null;
  onCountdownComplete: () => void;
  onFinish: () => void;
  onFocusLoss: () => void;
};

export function MatchReadingScreen({
  view,
  passage,
  match,
  selfPlayer,
  opponent,
  clockOffsetMs,
  focusLossCount,
  finishPending,
  actionError,
  onCountdownComplete,
  onFinish,
  onFocusLoss,
}: MatchReadingScreenProps) {
  const articleRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: ['start start', 'end end'],
  });

  const showCountdown = view === 'countdown';
  const isReading = view === 'reading';
  const isWaiting = view === 'waiting';
  const finishedLocally = selfPlayer.finished || isWaiting;

  const [showFinishFlash, setShowFinishFlash] = useState(false);
  const flashShown = useRef(false);

  useEffect(() => {
    if (finishedLocally && !flashShown.current) {
      flashShown.current = true;
      setShowFinishFlash(true);
      const timeout = window.setTimeout(() => setShowFinishFlash(false), 1100);
      return () => window.clearTimeout(timeout);
    }
  }, [finishedLocally]);

  const elapsedMs = useRaceElapsed(
    match.race_start_at,
    clockOffsetMs,
    isReading && !finishedLocally,
    finishedLocally ? selfPlayer.reading_time : null,
  );

  const { ref: endRef, reached } = useReachedEnd<HTMLDivElement>();
  useTabFocusGuard(isReading && !finishedLocally, onFocusLoss);

  const dwellReached = elapsedMs >= minimumReadMs(passage.wordCount);
  const canFinish = isReading && !finishedLocally && reached && dwellReached && !finishPending;

  const opponentName = opponent?.nickname ?? 'opponent';
  const opponentStatus = opponent?.finished
    ? `${opponentName} finished.`
    : `${opponentName} is reading…`;

  const hint = finishedLocally
    ? `Waiting for ${opponentName}…`
    : !reached
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

      <main className="flex-1 bg-reading-page">
        <div className={cn(readingShell, 'pb-16 pt-6 sm:pb-24 sm:pt-10')}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Text as="p" variant="small" className="font-semibold text-muted-foreground" aria-live="polite">
              {opponentStatus}
            </Text>
            {finishedLocally ? (
              <span className="rounded-full bg-accent px-3.5 py-1.5 text-[0.72rem] font-bold text-accent-foreground">
                ✓ Finished
              </span>
            ) : null}
          </div>

          {finishedLocally && !showFinishFlash ? (
            <div className="mb-8 rounded-lg border-2 border-border bg-surface p-6 sm:p-8">
              <Text as="p" variant="hand">
                You finished.
              </Text>
              <h2 className="mt-3 font-display text-[clamp(1.75rem,5vw,2.75rem)] font-extrabold leading-[0.92] tracking-[-0.03em]">
                Waiting for {opponentName}…
              </h2>
              <Text as="p" variant="small" className="mt-3 text-muted-foreground">
                The quiz opens when both of you are done reading.
              </Text>
            </div>
          ) : null}

          <article
            ref={articleRef}
            className={cn(
              'rounded-lg border-2 border-black/10 bg-reading-card px-6 py-10 text-reading-ink shadow-soft sm:px-10 sm:py-14',
              finishedLocally && 'opacity-70',
            )}
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
            </header>

            <div className="mt-8 select-none space-y-6 text-reading leading-[1.75] text-reading-ink/90 sm:mt-10 sm:space-y-7">
              {passage.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <div ref={endRef} aria-hidden="true" className="h-px w-full" />
          </article>

          {!finishedLocally ? (
            <footer className="mt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Text as="p" variant="hand" aria-live="polite">
                  {hint}
                </Text>
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={!canFinish}
                  onClick={onFinish}
                >
                  {finishPending ? 'Submitting…' : "I'm done"}
                </Button>
              </div>

              {actionError ? (
                <Text as="p" variant="small" className="mt-4 text-danger">
                  {actionError}
                </Text>
              ) : null}

              {focusLossCount > 0 ? (
                <Text as="p" variant="small" className="mt-4 font-semibold text-muted-foreground">
                  You left the tab {focusLossCount === 1 ? 'once' : `${focusLossCount} times`}. Noted,
                  not judged.
                </Text>
              ) : null}
            </footer>
          ) : null}
        </div>
      </main>

      <AnimatePresence>
        {showCountdown && match.race_start_at ? (
          <Countdown
            key="match-countdown"
            raceStartAt={match.race_start_at}
            clockOffsetMs={clockOffsetMs}
            onComplete={onCountdownComplete}
          />
        ) : null}
        {showFinishFlash ? <FinishOverlay key="match-finish" /> : null}
      </AnimatePresence>
    </>
  );
}
