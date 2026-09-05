import { getSupabaseClient } from '@/lib/supabase/client';
import { AppError, fromSupabaseError } from '@/lib/supabase/errors';
import type { PlayerRow } from '@/types/database';

export async function createPlayer(roomId: string, nickname: string): Promise<PlayerRow> {
  const trimmed = nickname.trim();
  if (!trimmed) {
    throw new AppError('INSERT_FAILED', { message: 'Nickname is required' });
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('players')
    .insert({ room_id: roomId, nickname: trimmed })
    .select('*')
    .single();

  if (error) {
    throw fromSupabaseError(error, 'INSERT_FAILED');
  }

  return data;
}

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

  return data ?? [];
}

export async function updatePlayerReadyState(
  playerId: string,
  ready: boolean,
): Promise<PlayerRow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('players')
    .update({ ready })
    .eq('id', playerId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw fromSupabaseError(error, 'UPDATE_FAILED');
  }
  if (!data) {
    throw new AppError('UPDATE_FAILED', { message: `Player ${playerId} not found` });
  }

  return data;
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

export async function updatePlayerResult(
  playerId: string,
  patch: PlayerResultPatch,
): Promise<PlayerRow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('players')
    .update(patch)
    .eq('id', playerId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw fromSupabaseError(error, 'UPDATE_FAILED');
  }
  if (!data) {
    throw new AppError('UPDATE_FAILED', { message: `Player ${playerId} not found` });
  }

  return data;
}

export async function removePlayer(playerId: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('players').delete().eq('id', playerId);

  if (error) {
    throw fromSupabaseError(error, 'UPDATE_FAILED');
  }
}
