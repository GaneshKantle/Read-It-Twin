/** Dev-only multiplayer diagnostics. Never logs session tokens or secrets. */

type MatchDebugPayload = {
  roomId?: string | null;
  matchId?: string | null;
  playerId?: string | null;
  matchState?: string | null;
  roomState?: string | null;
  raceStartAt?: string | null;
  offsetMs?: number;
  view?: string | null;
};

export function matchDebug(label: string, payload: MatchDebugPayload): void {
  if (!import.meta.env.DEV) {
    return;
  }
  console.debug(`[match] ${label}`, payload);
}
