import { setClockOffsetFromServerNow } from '@/lib/clockSync';
import { getSupabaseClient } from '@/lib/supabase/client';
import { AppError, fromSupabaseError } from '@/lib/supabase/errors';
import { asRecordPayload, parsePlayerRow, parseRoomRow } from '@/lib/services/rooms';
import type {
  AckRaceStartResult,
  FinishReadingResult,
  GradePassageResult,
  MatchRow,
  ResultRow,
  StartMatchResult,
  SubmitMatchQuizResult,
} from '@/types/database';

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
  return {
    ...(row as unknown as MatchRow),
    winner_player_id:
      typeof row.winner_player_id === 'string' ? row.winner_player_id : null,
  };
}

function parseResultRow(value: unknown): ResultRow | null {
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
  return row as unknown as ResultRow;
}

function parseGrade(value: unknown): GradePassageResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as unknown as GradePassageResult;
}

function applyServerNow(payload: Record<string, unknown>, t0: number, t1: number): string {
  const serverNow =
    typeof payload.server_now === 'string' ? payload.server_now : new Date().toISOString();
  setClockOffsetFromServerNow(serverNow, t0, t1);
  return serverNow;
}

export async function getServerTime(): Promise<string> {
  const client = getSupabaseClient();
  const t0 = Date.now();
  const { data, error } = await client.rpc('get_server_time');
  const t1 = Date.now();

  if (error) {
    throw fromSupabaseError(error, 'UNKNOWN');
  }

  const serverNow = typeof data === 'string' ? data : new Date().toISOString();
  setClockOffsetFromServerNow(serverNow, t0, t1);
  return serverNow;
}

export async function startMatch(
  roomId: string,
  playerId: string,
  sessionToken: string,
): Promise<StartMatchResult> {
  const client = getSupabaseClient();
  const t0 = Date.now();
  const { data, error } = await client.rpc('start_match', {
    p_room_id: roomId,
    p_player_id: playerId,
    p_session_token: sessionToken,
  });
  const t1 = Date.now();

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
    server_now: applyServerNow(payload, t0, t1),
  };
}

export async function ackRaceStart(
  roomId: string,
  playerId: string,
  sessionToken: string,
): Promise<AckRaceStartResult> {
  const client = getSupabaseClient();
  const t0 = Date.now();
  const { data, error } = await client.rpc('ack_race_start', {
    p_room_id: roomId,
    p_player_id: playerId,
    p_session_token: sessionToken,
  });
  const t1 = Date.now();

  if (error) {
    throw fromSupabaseError(error, 'UPDATE_FAILED');
  }

  const payload = asRecordPayload(data);
  if (!payload) {
    throw new AppError('UPDATE_FAILED', { message: 'ack_race_start returned no payload' });
  }

  return {
    room: parseRoomRow(payload.room),
    match: parseMatchRow(payload.match),
    server_now: applyServerNow(payload, t0, t1),
  };
}

export async function finishReading(
  matchId: string,
  playerId: string,
  sessionToken: string,
): Promise<FinishReadingResult> {
  const client = getSupabaseClient();
  const t0 = Date.now();
  const { data, error } = await client.rpc('finish_reading', {
    p_match_id: matchId,
    p_player_id: playerId,
    p_session_token: sessionToken,
  });
  const t1 = Date.now();

  if (error) {
    throw fromSupabaseError(error, 'UPDATE_FAILED');
  }

  const payload = asRecordPayload(data);
  if (!payload) {
    throw new AppError('UPDATE_FAILED', { message: 'finish_reading returned no payload' });
  }

  return {
    room: parseRoomRow(payload.room),
    match: parseMatchRow(payload.match),
    player: parsePlayerRow(payload.player),
    server_now: applyServerNow(payload, t0, t1),
  };
}

export async function submitMatchQuiz(
  matchId: string,
  playerId: string,
  sessionToken: string,
  answers: { questionId: string; selectedIndex: number | null }[],
): Promise<SubmitMatchQuizResult> {
  const client = getSupabaseClient();
  const t0 = Date.now();
  const { data, error } = await client.rpc('submit_match_quiz', {
    p_match_id: matchId,
    p_player_id: playerId,
    p_session_token: sessionToken,
    p_answers: answers,
  });
  const t1 = Date.now();

  if (error) {
    throw fromSupabaseError(error, 'UPDATE_FAILED');
  }

  const payload = asRecordPayload(data);
  if (!payload) {
    throw new AppError('UPDATE_FAILED', { message: 'submit_match_quiz returned no payload' });
  }

  const result = parseResultRow(payload.result);
  if (!result) {
    throw new AppError('UPDATE_FAILED', { message: 'submit_match_quiz returned no result' });
  }

  return {
    room: parseRoomRow(payload.room),
    match: parseMatchRow(payload.match),
    player: parsePlayerRow(payload.player),
    result,
    grade: parseGrade(payload.grade),
    server_now: applyServerNow(payload, t0, t1),
  };
}

export async function getMatch(matchId: string): Promise<MatchRow> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('matches').select('*').eq('id', matchId).maybeSingle();

  if (error) {
    throw fromSupabaseError(error, 'UNKNOWN');
  }
  if (!data) {
    throw new AppError('MATCH_NOT_FOUND', { message: `Match ${matchId} not found` });
  }

  return {
    ...data,
    winner_player_id: data.winner_player_id ?? null,
  };
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

  return data
    ? {
        ...data,
        winner_player_id: data.winner_player_id ?? null,
      }
    : null;
}

/** Incomplete race for the room, if any. */
export async function getActiveMatchForRoom(roomId: string): Promise<MatchRow | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('matches')
    .select('*')
    .eq('room_id', roomId)
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw fromSupabaseError(error, 'UNKNOWN');
  }

  return data
    ? {
        ...data,
        winner_player_id: data.winner_player_id ?? null,
      }
    : null;
}

/** Most recently completed match — used on the results screen. */
export async function getLatestCompletedMatchForRoom(
  roomId: string,
): Promise<MatchRow | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('matches')
    .select('*')
    .eq('room_id', roomId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw fromSupabaseError(error, 'UNKNOWN');
  }

  return data
    ? {
        ...data,
        winner_player_id: data.winner_player_id ?? null,
      }
    : null;
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

/** @deprecated Direct updates revoked; match completion is handled by submit_match_quiz. */
export async function completeMatch(matchId: string): Promise<MatchRow> {
  void matchId;
  throw new AppError('UPDATE_FAILED', {
    message: 'Direct match updates are disabled; use submit_match_quiz',
  });
}
