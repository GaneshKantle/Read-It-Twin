import { useEffect, useState } from 'react';
import { syncedNow } from '@/lib/clockSync';

const TICK_MS = 250;

/**
 * Display timer for multiplayer reading.
 * Elapsed = syncedNow − raceStartAt, frozen when `running` is false.
 * Authoritative stored duration still comes from the server finish RPC.
 */
export function useRaceElapsed(
  raceStartAt: string | null,
  clockOffsetMs: number,
  running: boolean,
  frozenMs: number | null = null,
): number {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (frozenMs != null) {
      setElapsedMs(frozenMs);
      return;
    }

    if (!raceStartAt) {
      setElapsedMs(0);
      return;
    }

    const startMs = Date.parse(raceStartAt);
    if (Number.isNaN(startMs)) {
      setElapsedMs(0);
      return;
    }

    const compute = () => Math.max(0, syncedNow(clockOffsetMs) - startMs);
    setElapsedMs(compute());

    if (!running) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedMs(compute());
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [clockOffsetMs, frozenMs, raceStartAt, running]);

  return elapsedMs;
}
