import { useEffect, useState } from 'react';

/** Ticks four times a second, which is enough for a seconds-resolution clock. */
const TICK_MS = 250;

/**
 * Milliseconds since `startedPerf`, updated while `running`. Uses the same
 * `performance.now()` clock the run result is measured with, so the number on
 * screen and the number in the result never disagree.
 */
export function useElapsedTime(startedPerf: number | null, running: boolean): number {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (startedPerf === null) {
      setElapsedMs(0);
      return;
    }

    setElapsedMs(performance.now() - startedPerf);

    if (!running) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedMs(performance.now() - startedPerf);
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [running, startedPerf]);

  return elapsedMs;
}
