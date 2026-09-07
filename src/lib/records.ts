import { isValidGameResult } from '@/lib/results';
import type { GameResult } from '@/types/run';

export const STORAGE_RECORDS_KEY = 'readit-records';

export type RecordKind = 'wpm' | 'comprehension' | 'score';

export interface PersonalRecords {
  bestWpm: number;
  bestComprehension: number;
  bestScore: number;
  runCount: number;
}

/** Minimal scored snapshot — solo GameResult or a multiplayer result row. */
export interface RecordableResult {
  wpm: number;
  comprehension: number;
  finalScore: number;
  /** Stable id for this attempt (finishedAt ms or submitted_at epoch). */
  finishedAt: number;
}

interface StoredRecords extends PersonalRecords {
  /** `finishedAt` of the run already counted, so a refresh cannot re-award it. */
  lastRecordedAt: number;
  lastFirstRun: boolean;
  lastBreaks: RecordKind[];
}

export interface RecordEvaluation {
  firstRun: boolean;
  breaks: RecordKind[];
  /** Bests as they stand after this run. */
  records: PersonalRecords;
}

const emptyRecords: StoredRecords = {
  bestWpm: 0,
  bestComprehension: 0,
  bestScore: 0,
  runCount: 0,
  lastRecordedAt: 0,
  lastFirstRun: false,
  lastBreaks: [],
};

const recordKinds: RecordKind[] = ['wpm', 'comprehension', 'score'];

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function readRecords(): StoredRecords {
  if (typeof window === 'undefined') {
    return emptyRecords;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_RECORDS_KEY);
    if (!raw) {
      return emptyRecords;
    }

    const parsed = JSON.parse(raw) as Partial<StoredRecords>;

    return {
      bestWpm: toNumber(parsed.bestWpm),
      bestComprehension: toNumber(parsed.bestComprehension),
      bestScore: toNumber(parsed.bestScore),
      runCount: toNumber(parsed.runCount),
      lastRecordedAt: toNumber(parsed.lastRecordedAt),
      lastFirstRun: parsed.lastFirstRun === true,
      lastBreaks: Array.isArray(parsed.lastBreaks)
        ? parsed.lastBreaks.filter((kind): kind is RecordKind =>
            recordKinds.includes(kind as RecordKind),
          )
        : [],
    };
  } catch {
    // Private mode, a full quota or hand-edited storage: records are a bonus,
    // never a reason to lose the result screen.
    return emptyRecords;
  }
}

function writeRecords(next: StoredRecords): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(next));
  } catch {
    // Ignored for the same reason as above.
  }
}

function toPersonalRecords(stored: StoredRecords): PersonalRecords {
  return {
    bestWpm: stored.bestWpm,
    bestComprehension: stored.bestComprehension,
    bestScore: stored.bestScore,
    runCount: stored.runCount,
  };
}

export function readPersonalRecords(): PersonalRecords {
  return toPersonalRecords(readRecords());
}

function isRecordableResult(value: unknown): value is RecordableResult {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const result = value as Partial<RecordableResult>;
  return (
    typeof result.wpm === 'number' &&
    Number.isFinite(result.wpm) &&
    result.wpm >= 0 &&
    typeof result.comprehension === 'number' &&
    Number.isFinite(result.comprehension) &&
    result.comprehension >= 0 &&
    result.comprehension <= 100 &&
    typeof result.finalScore === 'number' &&
    Number.isFinite(result.finalScore) &&
    result.finalScore >= 0 &&
    typeof result.finishedAt === 'number' &&
    Number.isFinite(result.finishedAt)
  );
}

function toRecordable(result: GameResult | RecordableResult): RecordableResult | null {
  if (isValidGameResult(result)) {
    return {
      wpm: result.wpm,
      comprehension: result.comprehension,
      finalScore: result.finalScore,
      finishedAt: result.finishedAt,
    };
  }
  if (isRecordableResult(result)) {
    return result;
  }
  return null;
}

/**
 * Files a finished run against the local bests and reports what it beat.
 * Called once per result; replaying the same run returns the stored verdict
 * rather than counting it again.
 */
export function applyPersonalRecords(result: GameResult | RecordableResult): RecordEvaluation {
  const stored = readRecords();
  const scored = toRecordable(result);

  if (!scored) {
    return { firstRun: false, breaks: [], records: toPersonalRecords(stored) };
  }

  if (stored.runCount > 0 && stored.lastRecordedAt === scored.finishedAt) {
    return {
      firstRun: stored.lastFirstRun,
      breaks: stored.lastBreaks,
      records: toPersonalRecords(stored),
    };
  }

  const firstRun = stored.runCount === 0;

  const breaks: RecordKind[] = firstRun
    ? []
    : recordKinds.filter((kind) => {
        if (kind === 'wpm') {
          return scored.wpm > stored.bestWpm;
        }
        if (kind === 'comprehension') {
          return scored.comprehension > stored.bestComprehension;
        }

        return scored.finalScore > stored.bestScore;
      });

  const next: StoredRecords = {
    bestWpm: Math.max(stored.bestWpm, scored.wpm),
    bestComprehension: Math.max(stored.bestComprehension, scored.comprehension),
    bestScore: Math.max(stored.bestScore, scored.finalScore),
    runCount: stored.runCount + 1,
    lastRecordedAt: scored.finishedAt,
    lastFirstRun: firstRun,
    lastBreaks: breaks,
  };

  writeRecords(next);

  return { firstRun, breaks, records: toPersonalRecords(next) };
}
