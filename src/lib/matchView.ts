import { remainingUntil } from '@/lib/clockSync';
import type { MatchRow, PlayerRow, ResultRow, RoomRow } from '@/types/database';
import type { MatchView } from '@/types/match';

export type ResolveMatchViewInput = {
  room: RoomRow | null;
  match: MatchRow | null;
  selfPlayer: PlayerRow | null;
  ownResult: ResultRow | null;
  clockOffsetMs?: number;
  /** Injected for tests; defaults to Date.now()-based remaining. */
  remainingMs?: number;
};

/**
 * Pure navigation resolver for the multiplayer race.
 * Room status is the broadcast lifecycle; per-player waiting is a view only.
 */
export function resolveMatchView(input: ResolveMatchViewInput): MatchView {
  const { room, match, selfPlayer, ownResult, clockOffsetMs = 0 } = input;

  if (!room || room.status === 'waiting' || room.status === 'ready' || room.status === 'closed') {
    return 'lobby';
  }

  if (room.status === 'results' || match?.status === 'results') {
    return 'results';
  }

  if (room.status === 'quiz' || match?.status === 'quiz') {
    if (ownResult || (selfPlayer?.final_score != null && selfPlayer.correct_answers != null)) {
      return 'quiz_waiting';
    }
    return 'quiz';
  }

  // countdown / reading
  const raceStartAt = match?.race_start_at ?? null;
  const remaining =
    input.remainingMs ??
    (raceStartAt ? remainingUntil(raceStartAt, clockOffsetMs) : 0);

  if (
    (room.status === 'countdown' || match?.status === 'countdown') &&
    raceStartAt &&
    remaining > 0
  ) {
    return 'countdown';
  }

  if (selfPlayer?.finished) {
    return 'waiting';
  }

  return 'reading';
}

/** Which digit of the synchronized countdown to show. */
export function countdownStepFromRemaining(remainingMs: number): '3' | '2' | '1' | 'Read' | null {
  if (remainingMs <= 0) {
    return null;
  }
  if (remainingMs > 2100) {
    return '3';
  }
  if (remainingMs > 1400) {
    return '2';
  }
  if (remainingMs > 700) {
    return '1';
  }
  return 'Read';
}
