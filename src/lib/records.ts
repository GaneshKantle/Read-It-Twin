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

/**
 * Files a finished run against the local bests and reports what it beat.
 * Called once per result; replaying the same run returns the stored verdict
 * rather than counting it again.
 */
export function applyPersonalRecords(result: GameResult): RecordEvaluation {
  const stored = readRecords();

  if (!isValidGameResult(result)) {
    return { firstRun: false, breaks: [], records: toPersonalRecords(stored) };
  }

  if (stored.runCount > 0 && stored.lastRecordedAt === result.finishedAt) {
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
          return result.wpm > stored.bestWpm;
        }
        if (kind === 'comprehension') {
          return result.comprehension > stored.bestComprehension;
        }

        return result.finalScore > stored.bestScore;
      });

  const next: StoredRecords = {
    bestWpm: Math.max(stored.bestWpm, result.wpm),
    bestComprehension: Math.max(stored.bestComprehension, result.comprehension),
    bestScore: Math.max(stored.bestScore, result.finalScore),
    runCount: stored.runCount + 1,
    lastRecordedAt: result.finishedAt,
    lastFirstRun: firstRun,
    lastBreaks: breaks,
  };

  writeRecords(next);

  return { firstRun, breaks, records: toPersonalRecords(next) };
}
