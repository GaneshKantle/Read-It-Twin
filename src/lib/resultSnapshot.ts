import { isValidGameResult } from '@/lib/results';
import type { GameResult } from '@/types/run';

export const SNAPSHOT_RESULT_KEY = 'readit-last-result';

/**
 * Run state lives in memory, so a refresh on the results screen would
 * otherwise throw the reader back to setup. The snapshot is read-only fuel for
 * the results screen: it is never pushed back into the live run, and it is
 * cleared the moment a new run starts.
 */
export function saveResultSnapshot(result: GameResult): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(SNAPSHOT_RESULT_KEY, JSON.stringify(result));
  } catch {
    // A refresh landing on the error state is acceptable; a crash is not.
  }
}

export function readResultSnapshot(): GameResult | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(SNAPSHOT_RESULT_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    return isValidGameResult(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearResultSnapshot(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(SNAPSHOT_RESULT_KEY);
  } catch {
    // Ignored.
  }
}
