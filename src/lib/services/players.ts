import { getSupabaseClient } from '@/lib/supabase/client';
import { AppError, fromSupabaseError } from '@/lib/supabase/errors';
import {
  asRecordPayload,
  parseJoinResult,
  parsePlayerRow,
  parseRoomRow,
} from '@/lib/services/rooms';
import type {
  LeaveRoomResult,
  PlayerRow,
  RequestRematchResult,
  RoomJoinResult,
  SetReadyResult,
} from '@/types/database';

export async function getPlayersForRoom(roomId: string): Promise<PlayerRow[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('players')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });

  if (error) {
    throw fromSupabaseError(error, 'INVALID_ROOM');
  }

  return (data ?? []).map((row) => ({
    ...row,
    wants_rematch: row.wants_rematch === true,
  }));
}

export async function joinRoom(
  roomCode: string,
  nickname: string,
  clientId: string,
): Promise<RoomJoinResult> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('join_room', {
    p_room_code: roomCode.toUpperCase(),
    p_nickname: nickname,
    p_client_id: clientId,
  });

  if (error) {
    throw fromSupabaseError(error, 'INSERT_FAILED');
  }

  return parseJoinResult(data);
}

export async function setPlayerReady(
  playerId: string,
  sessionToken: string,
  ready: boolean,
): Promise<SetReadyResult> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('set_player_ready', {
    p_player_id: playerId,
    p_session_token: sessionToken,
    p_ready: ready,
  });

  if (error) {
    throw fromSupabaseError(error, 'UPDATE_FAILED');
  }

  const payload = asRecordPayload(data);
  if (!payload) {
    throw new AppError('UPDATE_FAILED', { message: 'set_player_ready returned no payload' });
  }

  return {
    room: parseRoomRow(payload.room),
    player: parsePlayerRow(payload.player),
  };
}

export async function leaveRoom(
  playerId: string,
  sessionToken: string,
): Promise<LeaveRoomResult> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('leave_room', {
    p_player_id: playerId,
    p_session_token: sessionToken,
  });

  if (error) {
    throw fromSupabaseError(error, 'UPDATE_FAILED');
  }

  const payload = asRecordPayload(data);
  if (!payload) {
    throw new AppError('UPDATE_FAILED', { message: 'leave_room returned no payload' });
  }

  return {
    room: parseRoomRow(payload.room),
    closed: Boolean(payload.closed),
    host_left: Boolean(payload.host_left),
    kept_seat: Boolean(payload.kept_seat),
  };
}

export async function requestRematch(
  playerId: string,
  sessionToken: string,
): Promise<RequestRematchResult> {
  const client = getSupabaseClient();
  const t0 = Date.now();
  const { data, error } = await client.rpc('request_rematch', {
    p_player_id: playerId,
    p_session_token: sessionToken,
  });
  const t1 = Date.now();

  if (error) {
    throw fromSupabaseError(error, 'UPDATE_FAILED');
  }

  const payload = asRecordPayload(data);
  if (!payload) {
    throw new AppError('UPDATE_FAILED', { message: 'request_rematch returned no payload' });
  }

  const playersRaw = payload.players;
  const players: PlayerRow[] = Array.isArray(playersRaw)
    ? playersRaw.map((row) => parsePlayerRow(row))
    : [];

  const serverNow =
    typeof payload.server_now === 'string' ? payload.server_now : new Date().toISOString();
  void t0;
  void t1;

  return {
    room: parseRoomRow(payload.room),
    players,
    rematch_ready: Boolean(payload.rematch_ready),
    server_now: serverNow,
  };
}

/** @deprecated Prefer joinRoom / createRoomAndJoin RPCs for lobby. */
export async function createPlayer(roomId: string, nickname: string): Promise<PlayerRow> {
  void roomId;
  void nickname;
  throw new AppError('INSERT_FAILED', {
    message: 'Direct player inserts are disabled; use create_room_and_join or join_room',
  });
}

export interface PlayerResultPatch {
  finished?: boolean;
  reading_time?: number;
  wpm?: number;
  correct_answers?: number;
  total_questions?: number;
  comprehension?: number;
  final_score?: number;
}

/** Direct result writes remain for later phases once result RPCs exist. */
export async function updatePlayerResult(
  playerId: string,
  patch: PlayerResultPatch,
): Promise<PlayerRow> {
  void playerId;
  void patch;
  throw new AppError('UPDATE_FAILED', {
    message: 'Direct player result updates are disabled until Phase 08+ RPCs',
  });
}

export async function updatePlayerReadyState(
  playerId: string,
  ready: boolean,
): Promise<PlayerRow> {
  void playerId;
  void ready;
  throw new AppError('UPDATE_FAILED', {
    message: 'Direct ready updates are disabled; use set_player_ready with a session token',
  });
}

export async function removePlayer(playerId: string): Promise<void> {
  void playerId;
  throw new AppError('UPDATE_FAILED', {
    message: 'Direct player deletes are disabled; use leave_room with a session token',
  });
}
