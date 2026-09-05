import { getSupabaseClient } from '@/lib/supabase/client';
import { AppError, fromSupabaseError } from '@/lib/supabase/errors';
import type { MatchRow } from '@/types/database';

export async function createMatch(
  roomId: string,
  passageId?: string | null,
): Promise<MatchRow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('matches')
    .insert({ room_id: roomId, passage_id: passageId ?? null })
    .select('*')
    .single();

  if (error) {
    throw fromSupabaseError(error, 'INSERT_FAILED');
  }

  return data;
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

export async function completeMatch(matchId: string): Promise<MatchRow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('matches')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', matchId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw fromSupabaseError(error, 'UPDATE_FAILED');
  }
  if (!data) {
    throw new AppError('UPDATE_FAILED', { message: `Match ${matchId} not found` });
  }

  return data;
}
