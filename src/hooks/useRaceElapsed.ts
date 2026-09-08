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
      const frame = window.requestAnimationFrame(() => {
        setElapsedMs(frozenMs);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (!raceStartAt) {
      const frame = window.requestAnimationFrame(() => {
        setElapsedMs(0);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const startMs = Date.parse(raceStartAt);
    if (Number.isNaN(startMs)) {
      const frame = window.requestAnimationFrame(() => {
        setElapsedMs(0);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const update = () => {
      setElapsedMs(Math.max(0, syncedNow(clockOffsetMs) - startMs));
    };

    const frame = window.requestAnimationFrame(update);

    if (!running) {
      return () => window.cancelAnimationFrame(frame);
    }

    const interval = window.setInterval(update, TICK_MS);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, [clockOffsetMs, frozenMs, raceStartAt, running]);

  return elapsedMs;
}
