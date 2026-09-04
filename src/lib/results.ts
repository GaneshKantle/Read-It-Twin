import type { GameResult, PlayerResult, ResultComparison } from '@/types/run';

function isCleanNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * A result is only shown when every number on it is real. Anything else lands
 * on the error state rather than printing NaN at the reader.
 */
export function isValidGameResult(value: unknown): value is GameResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as Partial<GameResult>;

  const numbersAreClean = [
    result.readingTimeMs,
    result.wpm,
    result.correctAnswers,
    result.totalQuestions,
    result.comprehension,
    result.finalScore,
    result.wordCount,
    result.focusLossCount,
  ].every(isCleanNumber);

  return (
    numbersAreClean &&
    typeof result.passageTitle === 'string' &&
    Array.isArray(result.answers) &&
    result.comprehension! <= 100 &&
    result.correctAnswers! <= result.totalQuestions!
  );
}

/** Flattens a finished run into the shape the result screen renders. */
export function toPlayerResult(game: GameResult, nickname = 'You'): PlayerResult {
  return {
    nickname,
    readingTime: Math.round(game.readingTimeMs / 1000),
    wpm: game.wpm,
    comprehension: game.comprehension,
    correctAnswers: game.correctAnswers,
    totalQuestions: game.totalQuestions,
    finalScore: game.finalScore,
  };
}

/**
 * Gaps are always A minus B, so a positive number means A was ahead. Ready for
 * the two-player screen; the solo screen never calls it.
 */
export function compareResults(playerA: PlayerResult, playerB: PlayerResult): ResultComparison {
  const scoreDifference = playerA.finalScore - playerB.finalScore;

  return {
    winner: scoreDifference === 0 ? 'draw' : scoreDifference > 0 ? 'playerA' : 'playerB',
    wpmDifference: playerA.wpm - playerB.wpm,
    comprehensionDifference: playerA.comprehension - playerB.comprehension,
    scoreDifference,
  };
}

/**
 * `m:ss` for a finished run. The live timer keeps `formatClock`'s padded
 * minutes; a result reads better as 2:14.
 */
export function formatRunClock(ms: number): string {
  return formatRunTime(Math.round(ms / 1000));
}

/**
 * Same clock from whole seconds (the PlayerResult shape).
 */
export function formatRunTime(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);

  return `${minutes}:${String(safeSeconds % 60).padStart(2, '0')}`;
}
