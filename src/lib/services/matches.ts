import { getSupabaseClient } from '@/lib/supabase/client';
import { AppError, fromSupabaseError } from '@/lib/supabase/errors';
import { asRecordPayload, parseRoomRow } from '@/lib/services/rooms';
import type { MatchRow, StartMatchResult } from '@/types/database';

function parseMatchRow(value: unknown): MatchRow | null {
  if (value == null) {
    return null;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string') {
    return null;
  }
  return row as unknown as MatchRow;
}

export async function startMatch(
  roomId: string,
  playerId: string,
  sessionToken: string,
): Promise<StartMatchResult> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('start_match', {
    p_room_id: roomId,
    p_player_id: playerId,
    p_session_token: sessionToken,
  });

  if (error) {
    throw fromSupabaseError(error, 'UPDATE_FAILED');
  }

  const payload = asRecordPayload(data);
  if (!payload) {
    throw new AppError('UPDATE_FAILED', { message: 'start_match returned no payload' });
  }

  return {
    room: parseRoomRow(payload.room),
    match: parseMatchRow(payload.match),
  };
}

export async function getMatch(matchId: string): Promise<MatchRow> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('matches').select('*').eq('id', matchId).maybeSingle();

  if (error) {
    throw fromSupabaseError(error, 'UNKNOWN');
  }
  if (!data) {
    throw new AppError('UNKNOWN', { message: `Match ${matchId} not found` });
  }

  return data;
}

export async function getLatestMatchForRoom(roomId: string): Promise<MatchRow | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('matches')
    .select('*')
    .eq('room_id', roomId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw fromSupabaseError(error, 'UNKNOWN');
  }

  return data;
}

/** @deprecated Prefer startMatch RPC. */
export async function createMatch(
  roomId: string,
  passageId?: string | null,
): Promise<MatchRow> {
  void roomId;
  void passageId;
  throw new AppError('INSERT_FAILED', {
    message: 'Direct match inserts are disabled; use start_match',
  });
}

/** @deprecated Direct updates revoked for anon until a complete_match RPC exists. */
export async function completeMatch(matchId: string): Promise<MatchRow> {
  void matchId;
  throw new AppError('UPDATE_FAILED', {
    message: 'Direct match updates are disabled until a complete_match RPC exists',
  });
}
