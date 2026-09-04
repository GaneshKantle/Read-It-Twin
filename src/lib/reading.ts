import type { Difficulty } from '@/types/run';

/** Assumed comfortable pace per difficulty, used only for pre-run estimates. */
const ESTIMATE_PACE: Record<Difficulty, number> = {
  easy: 240,
  medium: 215,
  hard: 190,
  expert: 170,
};

/**
 * A pace no honest reader sustains. Used as an anti-cheat floor so a short
 * passage that fits on one screen cannot be finished the instant it appears.
 */
export const IMPLAUSIBLE_PACE = 700;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countWordsIn(paragraphs: string[]): number {
  return paragraphs.reduce((total, paragraph) => total + countWords(paragraph), 0);
}

export function calculateWpm(wordCount: number, durationMs: number): number {
  if (durationMs <= 0) {
    return 0;
  }

  return wordCount / (durationMs / 60_000);
}

export function estimateReadingMs(wordCount: number, difficulty: Difficulty): number {
  return (wordCount / ESTIMATE_PACE[difficulty]) * 60_000;
}

/** Shortest time we accept as a genuine read of this passage. */
export function minimumReadMs(wordCount: number): number {
  return (wordCount / IMPLAUSIBLE_PACE) * 60_000;
}

/** `mm:ss`, for the reading timer. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Rounded-up minutes, for "about 2 min" style estimates. */
export function formatMinutes(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60_000));

  return `${minutes} min`;
}
