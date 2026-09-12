import { describe, expect, it } from 'vitest';
import { detectPlayerLeave, leaveNoticeCopy } from '@/lib/leaveNotice';
import type { PlayerRow } from '@/types/database';

function player(id: string, nickname: string): PlayerRow {
  return {
    id,
    room_id: 'room-1',
    nickname,
    ready: false,
    joined_at: '2026-09-12T00:00:00.000Z',
    finished: false,
    finished_at: null,
    reading_time: null,
    wpm: null,
    correct_answers: null,
    total_questions: null,
    comprehension: null,
    final_score: null,
    wants_rematch: false,
  };
}

describe('detectPlayerLeave', () => {
  const host = player('host', 'Maya');
  const guest = player('guest', 'Alex');

  it('notifies the host when the guest leaves', () => {
    expect(detectPlayerLeave([host, guest], [host], 'host', 'host')).toEqual({
      nickname: 'Alex',
      wasHost: false,
      roomOpen: true,
    });
  });

  it('notifies the guest when the host leaves', () => {
    expect(detectPlayerLeave([host, guest], [guest], 'guest', 'host')).toEqual({
      nickname: 'Maya',
      wasHost: true,
      roomOpen: true,
    });
  });

  it('does not notify the person who left', () => {
    expect(detectPlayerLeave([host, guest], [host], 'guest', 'host')).toBeNull();
  });

  it('ignores the first join and empty seats', () => {
    expect(detectPlayerLeave([host], [host, guest], 'host', 'host')).toBeNull();
    expect(detectPlayerLeave([], [host], 'host', 'host')).toBeNull();
  });
});

describe('leaveNoticeCopy', () => {
  it('names a guest departure for the host', () => {
    expect(leaveNoticeCopy({ nickname: 'Alex', wasHost: false })).toEqual({
      title: 'Alex left',
      body: 'They left the lobby. The seat is open again — share the invite when you are ready.',
    });
  });

  it('keeps the lobby open when the host can rejoin', () => {
    expect(leaveNoticeCopy({ nickname: 'Maya', wasHost: true, roomOpen: true })).toEqual({
      title: 'Maya left',
      body: 'The host left the lobby. If they come back, this race continues.',
    });
  });

  it('names a host departure when the race closed', () => {
    expect(leaveNoticeCopy({ nickname: 'Maya', wasHost: true, roomOpen: false })).toEqual({
      title: 'Maya left',
      body: 'The host walked out, so this race closed.',
    });
  });
});
