import { describe, expect, it } from 'vitest';
import { calculateWpm } from '@/lib/reading';
import {
  calculateComprehension,
  calculateFinalScore,
  formatComprehension,
} from '@/lib/scoring';
import { outcomeFromWinner, resolveRematchState } from '@/lib/rematch';
import { resolveMatchView } from '@/lib/matchView';
import { isValidRoomCode, normalizeRoomCode } from '@/lib/roomCode';
import { compareMatchResults } from '@/lib/results';
import type { MatchRow, PlayerRow, ResultRow, RoomRow } from '@/types/database';

describe('calculateWpm', () => {
  it('scores 500 words in 2 minutes as 250 WPM', () => {
    expect(calculateWpm(500, 120_000)).toBe(250);
  });

  it('returns 0 for zero or negative duration', () => {
    expect(calculateWpm(500, 0)).toBe(0);
    expect(calculateWpm(500, -1000)).toBe(0);
  });

  it('returns 0 for non-finite inputs', () => {
    expect(calculateWpm(Number.NaN, 60_000)).toBe(0);
    expect(calculateWpm(500, Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('scoring', () => {
  it('scores 4/5 comprehension as 80%', () => {
    expect(calculateComprehension(4, 5)).toBe(80);
  });

  it('scores effective score as WPM × comprehension decimal', () => {
    expect(calculateFinalScore(250, 80)).toBe(200);
  });

  it('handles zero questions and invalid values safely', () => {
    expect(calculateComprehension(0, 0)).toBe(0);
    expect(calculateComprehension(3, 0)).toBe(0);
    expect(calculateFinalScore(Number.NaN, 80)).toBe(0);
    expect(formatComprehension(Number.NaN)).toBe('0%');
  });

  it('handles all correct and none correct', () => {
    expect(calculateComprehension(5, 5)).toBe(100);
    expect(calculateComprehension(0, 5)).toBe(0);
    expect(calculateFinalScore(250, 100)).toBe(250);
    expect(calculateFinalScore(250, 0)).toBe(0);
  });
});

describe('winner and draw', () => {
  it('picks the higher effective score as winner', () => {
    const comparison = compareMatchResults(
      {
        nickname: 'A',
        readingTime: 60,
        wpm: 250,
        comprehension: 80,
        correctAnswers: 4,
        totalQuestions: 5,
        finalScore: 200,
      },
      {
        nickname: 'B',
        readingTime: 70,
        wpm: 250,
        comprehension: 76,
        correctAnswers: 4,
        totalQuestions: 5,
        finalScore: 190,
      },
    );
    expect(comparison.winner).toBe('playerA');
    expect(outcomeFromWinner('player-a', 'player-a')).toBe('win');
    expect(outcomeFromWinner('player-a', 'player-b')).toBe('loss');
  });

  it('declares a draw on equal scores', () => {
    const comparison = compareMatchResults(
      {
        nickname: 'A',
        readingTime: 60,
        wpm: 250,
        comprehension: 80,
        correctAnswers: 4,
        totalQuestions: 5,
        finalScore: 200,
      },
      {
        nickname: 'B',
        readingTime: 60,
        wpm: 250,
        comprehension: 80,
        correctAnswers: 4,
        totalQuestions: 5,
        finalScore: 200,
      },
    );
    expect(comparison.winner).toBe('draw');
    expect(outcomeFromWinner('player-a', null)).toBe('draw');
  });
});

describe('resolveMatchView', () => {
  const baseRoom = {
    id: 'room-1',
    room_code: 'ABCD',
    status: 'waiting',
    passage_id: null,
    host_player_id: null,
    created_at: '',
    expires_at: '',
  } as RoomRow;

  const baseMatch = {
    id: 'match-1',
    room_id: 'room-1',
    passage_id: null,
    started_at: '',
    completed_at: null,
    status: 'countdown',
    race_start_at: '2099-01-01T00:00:00.000Z',
    winner_player_id: null,
  } as MatchRow;

  const self = {
    id: 'p1',
    finished: false,
    final_score: null,
    correct_answers: null,
  } as PlayerRow;

  it('keeps results from becoming reading', () => {
    expect(
      resolveMatchView({
        room: { ...baseRoom, status: 'results' },
        match: { ...baseMatch, status: 'results' },
        selfPlayer: self,
        ownResult: null,
      }),
    ).toBe('results');
  });

  it('shows waiting only after the player finished reading', () => {
    expect(
      resolveMatchView({
        room: { ...baseRoom, status: 'reading' },
        match: { ...baseMatch, status: 'reading', race_start_at: '2000-01-01T00:00:00.000Z' },
        selfPlayer: { ...self, finished: true },
        ownResult: null,
        remainingMs: 0,
      }),
    ).toBe('waiting');
  });

  it('does not treat lobby as reading', () => {
    expect(
      resolveMatchView({
        room: { ...baseRoom, status: 'waiting' },
        match: null,
        selfPlayer: self,
        ownResult: null,
      }),
    ).toBe('lobby');
  });

  it('shows quiz_waiting when own result exists', () => {
    expect(
      resolveMatchView({
        room: { ...baseRoom, status: 'quiz' },
        match: { ...baseMatch, status: 'quiz' },
        selfPlayer: self,
        ownResult: { id: 'r1' } as ResultRow,
      }),
    ).toBe('quiz_waiting');
  });
});

describe('rematch state', () => {
  it('resolves host and guest rematch requests', () => {
    expect(
      resolveRematchState({
        hostPlayerId: 'host',
        selfPlayerId: 'host',
        selfWantsRematch: true,
        opponentWantsRematch: false,
      }),
    ).toBe('player_a_requested');

    expect(
      resolveRematchState({
        hostPlayerId: 'host',
        selfPlayerId: 'guest',
        selfWantsRematch: true,
        opponentWantsRematch: false,
      }),
    ).toBe('player_b_requested');

    expect(
      resolveRematchState({
        hostPlayerId: 'host',
        selfPlayerId: 'host',
        selfWantsRematch: true,
        opponentWantsRematch: true,
      }),
    ).toBe('both_ready');
  });
});

describe('room codes', () => {
  it('normalizes and validates invite codes', () => {
    expect(normalizeRoomCode(' ab12 ')).toBe('AB12');
    expect(isValidRoomCode('ABCD')).toBe(true);
    expect(isValidRoomCode('AB1O')).toBe(false);
    expect(isValidRoomCode('ABC')).toBe(false);
    expect(isValidRoomCode('')).toBe(false);
  });
});
