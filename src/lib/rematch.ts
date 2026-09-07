/**
 * Rematch negotiation is derived from the two players' wants_rematch flags.
 * Player A is the room host; Player B is the other seat.
 */

export const REMATCH_STATES = [
  'none',
  'player_a_requested',
  'player_b_requested',
  'both_ready',
] as const;

export type RematchState = (typeof REMATCH_STATES)[number];

export type RematchPlayers = {
  hostPlayerId: string | null;
  selfPlayerId: string | null;
  selfWantsRematch: boolean;
  opponentWantsRematch: boolean;
  opponentNickname: string | null;
  roomClosed: boolean;
  playerCount: number;
};

export function resolveRematchState(input: {
  hostPlayerId: string | null;
  selfPlayerId: string | null;
  selfWantsRematch: boolean;
  opponentWantsRematch: boolean;
}): RematchState {
  const { hostPlayerId, selfPlayerId, selfWantsRematch, opponentWantsRematch } = input;

  if (selfWantsRematch && opponentWantsRematch) {
    return 'both_ready';
  }

  if (!selfWantsRematch && !opponentWantsRematch) {
    return 'none';
  }

  // Attribute the single request to host (A) or guest (B).
  const hostIsSelf = hostPlayerId != null && hostPlayerId === selfPlayerId;
  if (selfWantsRematch) {
    return hostIsSelf ? 'player_a_requested' : 'player_b_requested';
  }

  // Opponent requested
  return hostIsSelf ? 'player_b_requested' : 'player_a_requested';
}

/** Outcome for the current player from the server-stored winner id. */
export function outcomeFromWinner(
  selfPlayerId: string | null,
  winnerPlayerId: string | null,
): 'win' | 'loss' | 'draw' {
  if (winnerPlayerId == null) {
    return 'draw';
  }
  if (selfPlayerId != null && winnerPlayerId === selfPlayerId) {
    return 'win';
  }
  return 'loss';
}
