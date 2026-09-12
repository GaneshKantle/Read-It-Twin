import { getSupabaseClient } from '@/lib/supabase/client';
import { AppError, fromSupabaseError, isAppError } from '@/lib/supabase/errors';
import type { PlayerRow, RoomJoinResult, RoomRow } from '@/types/database';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function parseRoomRow(value: unknown): RoomRow {
  const row = asRecord(value);
  if (!row || typeof row.id !== 'string' || typeof row.room_code !== 'string') {
    throw new AppError('INVALID_ROOM', { message: 'Malformed room payload' });
  }
  return {
    ...(row as unknown as RoomRow),
    last_left_nickname:
      typeof row.last_left_nickname === 'string' ? row.last_left_nickname : null,
    last_left_at: typeof row.last_left_at === 'string' ? row.last_left_at : null,
    last_left_was_host: row.last_left_was_host === true,
  };
}

export function parsePlayerRow(value: unknown): PlayerRow {
  const row = asRecord(value);
  if (!row || typeof row.id !== 'string' || typeof row.nickname !== 'string') {
    throw new AppError('INSERT_FAILED', { message: 'Malformed player payload' });
  }
  return {
    ...(row as unknown as PlayerRow),
    wants_rematch: row.wants_rematch === true,
  };
}

export function parseJoinResult(data: unknown): RoomJoinResult {
  const payload = asRecord(data);
  if (!payload) {
    throw new AppError('INSERT_FAILED', { message: 'Join RPC returned no payload' });
  }
  const token = payload.session_token;
  if (typeof token !== 'string') {
    throw new AppError('INVALID_SESSION', { message: 'Join RPC missing session token' });
  }
  return {
    room: parseRoomRow(payload.room),
    player: parsePlayerRow(payload.player),
    session_token: token,
  };
}

export function asRecordPayload(value: unknown): Record<string, unknown> | null {
  return asRecord(value);
}

function isRoomExpiredOrClosed(room: RoomRow): boolean {
  return room.status === 'closed' || new Date(room.expires_at).getTime() <= Date.now();
}

export function classifyRoomState(room: RoomRow): 'ok' | 'expired' | 'closed' {
  if (new Date(room.expires_at).getTime() <= Date.now()) {
    return 'expired';
  }
  if (room.status === 'closed') {
    return 'closed';
  }
  return 'ok';
}

export async function createRoomAndJoin(
  nickname: string,
  clientId: string,
): Promise<RoomJoinResult> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('create_room_and_join', {
    p_nickname: nickname,
    p_client_id: clientId,
  });

  if (error) {
    throw fromSupabaseError(error, 'INSERT_FAILED');
  }

  return parseJoinResult(data);
}

/** Legacy helper — revoked for anon clients in Phase 10. Prefer createRoomAndJoin. */
export async function createRoom(_passageId?: string | null): Promise<RoomRow> {
  throw new AppError('SUPABASE_UNAVAILABLE', {
    message: 'create_room_with_code is not available to clients',
  });
}

export async function getRoomByCode(roomCode: string): Promise<RoomRow> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('get_room_by_code', {
    p_room_code: roomCode.toUpperCase(),
  });

  if (error) {
    throw fromSupabaseError(error, 'INVALID_ROOM');
  }
  if (!data) {
    throw new AppError('INVALID_ROOM');
  }

  return parseRoomRow(data);
}

/**
 * Lookup that never throws for missing rooms — used by the join gate.
 * Throws only on network/config failures.
 */
export async function lookupRoomByCode(
  roomCode: string,
): Promise<{ room: RoomRow; state: 'ok' | 'expired' | 'closed' } | { room: null; state: 'missing' }> {
  try {
    const room = await getRoomByCode(roomCode);
    return { room, state: classifyRoomState(room) };
  } catch (error) {
    if (isAppError(error) && (error.code === 'INVALID_ROOM' || error.code === 'EXPIRED_ROOM')) {
      return { room: null, state: 'missing' };
    }
    throw error;
  }
}

export async function getRoomById(roomId: string): Promise<RoomRow> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('rooms').select('*').eq('id', roomId).maybeSingle();

  if (error) {
    throw fromSupabaseError(error, 'INVALID_ROOM');
  }
  if (!data) {
    throw new AppError('INVALID_ROOM');
  }

  if (isRoomExpiredOrClosed(data)) {
    throw new AppError('EXPIRED_ROOM', { message: `Room ${data.room_code} is expired or closed` });
  }

  return parseRoomRow(data);
}

/** Soft-close helper — revoked for anon clients in Phase 10. Rooms expire on read. */
export async function expireRoom(_roomId: string): Promise<RoomRow> {
  throw new AppError('SUPABASE_UNAVAILABLE', {
    message: 'expire_room is not available to clients',
  });
}
