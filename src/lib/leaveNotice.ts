import type { PlayerRow } from '@/types/database';

export type LeaveNotice = {
  nickname: string;
  wasHost: boolean;
};

export function leaveNoticeCopy(notice: LeaveNotice): { title: string; body: string } {
  const name = notice.nickname.trim() || 'Your opponent';
  if (notice.wasHost) {
    return {
      title: `${name} left`,
      body: 'The host walked out, so this race closed.',
    };
  }
  return {
    title: `${name} left`,
    body: 'They left the lobby. The seat is open again — share the invite when you are ready.',
  };
}

export function detectPlayerLeave(
  previous: PlayerRow[],
  next: PlayerRow[],
  selfPlayerId: string | null,
  hostPlayerId: string | null,
): LeaveNotice | null {
  if (!selfPlayerId || previous.length < 2 || next.length >= previous.length) {
    return null;
  }

  const stillHere = next.some((player) => player.id === selfPlayerId);
  if (!stillHere) {
    return null;
  }

  const nextIds = new Set(next.map((player) => player.id));
  const gone = previous.find((player) => player.id !== selfPlayerId && !nextIds.has(player.id));
  if (!gone) {
    return null;
  }

  return {
    nickname: gone.nickname,
    wasHost: Boolean(hostPlayerId) && gone.id === hostPlayerId,
  };
}
