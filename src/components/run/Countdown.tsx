import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Text } from '@/components/ui/Text';
import { remainingUntil } from '@/lib/clockSync';
import { countdownStepFromRemaining } from '@/lib/matchView';
import { motionEase, motionTiming } from '@/lib/motion';
import { RACE_COUNTDOWN_MS, RACE_COUNTDOWN_STEP_MS } from '@/types/match';

const steps = ['3', '2', '1', 'Read'] as const;
const STEP_MS = RACE_COUNTDOWN_STEP_MS;

type CountdownProps = {
  onComplete: () => void;
  /** Authoritative race start (ISO). When set, digits are derived from the clock. */
  raceStartAt?: string | null;
  clockOffsetMs?: number;
};

/**
 * Covers the passage completely until the run begins, so nothing can be read
 * before the clock starts.
 *
 * Solo: local step timer (STEP_MS each).
 * Multiplayer: digits derived from raceStartAt − syncedNow (joins mid-countdown correctly).
 */
export function Countdown({ onComplete, raceStartAt = null, clockOffsetMs = 0 }: CountdownProps) {
  const reduceMotion = useReducedMotion();
  const completed = useRef(false);
  const authoritative = Boolean(raceStartAt);

  const [index, setIndex] = useState(0);
  const [authStep, setAuthStep] = useState<'3' | '2' | '1' | 'Read' | null>(() => {
    if (!raceStartAt) {
      return null;
    }
    return countdownStepFromRemaining(remainingUntil(raceStartAt, clockOffsetMs));
  });
  const [progress, setProgress] = useState(() => {
    if (!raceStartAt) {
      return 0;
    }
    const remaining = remainingUntil(raceStartAt, clockOffsetMs);
    return Math.max(0, Math.min(1, 1 - remaining / RACE_COUNTDOWN_MS));
  });

  // Solo local timer
  useEffect(() => {
    if (authoritative) {
      return;
    }

    if (index >= steps.length) {
      if (!completed.current) {
        completed.current = true;
        onComplete();
      }
      return;
    }

    const timeout = window.setTimeout(() => setIndex((current) => current + 1), STEP_MS);
    return () => window.clearTimeout(timeout);
  }, [authoritative, index, onComplete]);

  // Authoritative synced countdown
  useEffect(() => {
    if (!authoritative || !raceStartAt) {
      return;
    }

    const tick = () => {
      const remaining = remainingUntil(raceStartAt, clockOffsetMs);
      setProgress(Math.max(0, Math.min(1, 1 - remaining / RACE_COUNTDOWN_MS)));

      if (remaining <= 0) {
        setAuthStep(null);
        if (!completed.current) {
          completed.current = true;
          onComplete();
        }
        return;
      }

      setAuthStep(countdownStepFromRemaining(remaining));
    };

    tick();
    const interval = window.setInterval(tick, 50);
    return () => window.clearInterval(interval);
  }, [authoritative, clockOffsetMs, onComplete, raceStartAt]);

  const step = authoritative
    ? (authStep ?? 'Read')
    : steps[Math.min(index, steps.length - 1)];

  const soloProgressDuration = (STEP_MS * steps.length) / 1000;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-background"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: motionTiming.fast, ease: motionEase }}
    >
      <Text as="p" variant="hand">
        Lock in.
      </Text>

      <div
        aria-live="assertive"
        className="flex h-[1.1em] items-center justify-center font-display text-[clamp(5rem,26vw,14rem)] font-extrabold leading-none tracking-[-0.05em]"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={step}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 1.06 }}
            transition={{ duration: motionTiming.fast, ease: motionEase }}
            className="block"
          >
            {step}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="h-2 w-40 overflow-hidden rounded-full bg-border/60">
        {authoritative ? (
          <div
            className="h-2 origin-left rounded-full bg-accent"
            style={{ transform: `scaleX(${progress})` }}
          />
        ) : (
          <motion.div
            className="h-2 origin-left rounded-full bg-accent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: soloProgressDuration, ease: 'linear' }
            }
          />
        )}
      </div>
    </motion.div>
  );
}
