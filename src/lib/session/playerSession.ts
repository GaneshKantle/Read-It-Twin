/** Lightweight anonymous player identity for room lobbies. No credentials. */

export const STORAGE_CLIENT_ID_KEY = 'read-it-together-player-id';
export const STORAGE_ROOM_SESSION_KEY = 'read-it-together-room-session';

export type RoomSession = {
  roomCode: string;
  roomId: string;
  playerId: string;
  sessionToken: string;
};

function createUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

/** Stable anonymous client id for this browser. */
export function getOrCreateClientId(): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_CLIENT_ID_KEY);
    if (existing) {
      return existing;
    }
    const next = createUuid();
    window.localStorage.setItem(STORAGE_CLIENT_ID_KEY, next);
    return next;
  } catch {
    return createUuid();
  }
}

export function readRoomSession(): RoomSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_ROOM_SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<RoomSession>;
    if (
      typeof parsed.roomCode !== 'string' ||
      typeof parsed.roomId !== 'string' ||
      typeof parsed.playerId !== 'string' ||
      typeof parsed.sessionToken !== 'string'
    ) {
      return null;
    }
    return {
      roomCode: parsed.roomCode.toUpperCase(),
      roomId: parsed.roomId,
      playerId: parsed.playerId,
      sessionToken: parsed.sessionToken,
    };
  } catch {
    return null;
  }
}

export function writeRoomSession(session: RoomSession): void {
  try {
    window.localStorage.setItem(
      STORAGE_ROOM_SESSION_KEY,
      JSON.stringify({
        ...session,
        roomCode: session.roomCode.toUpperCase(),
      }),
    );
  } catch {
    // Storage may be unavailable; lobby still works for this tab until refresh.
  }
}

export function clearRoomSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_ROOM_SESSION_KEY);
  } catch {
    // ignore
  }
}

/** Return the stored session only when it matches this room code. */
export function getSessionForRoom(roomCode: string): RoomSession | null {
  const session = readRoomSession();
  if (!session) {
    return null;
  }
  if (session.roomCode !== roomCode.toUpperCase()) {
    return null;
  }
  return session;
}
