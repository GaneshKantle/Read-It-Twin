import { getSupabaseClient } from '@/lib/supabase/client';
import { AppError, fromSupabaseError } from '@/lib/supabase/errors';
import type { ResultRow } from '@/types/database';

/** Direct client inserts are revoked; use submitMatchQuiz RPC. */
export async function saveResult(): Promise<ResultRow> {
  throw new AppError('INSERT_FAILED', {
    message: 'Direct result inserts are disabled; use submit_match_quiz',
  });
}

export async function getMatchResults(matchId: string): Promise<ResultRow[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('results').select('*').eq('match_id', matchId);

  if (error) {
    throw fromSupabaseError(error, 'UNKNOWN');
  }

  return data ?? [];
}

export async function getPlayerResultForMatch(
  matchId: string,
  playerId: string,
): Promise<ResultRow | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('results')
    .select('*')
    .eq('match_id', matchId)
    .eq('player_id', playerId)
    .maybeSingle();

  if (error) {
    throw fromSupabaseError(error, 'UNKNOWN');
  }

  return data;
}

export async function getResultById(resultId: string): Promise<ResultRow> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('results').select('*').eq('id', resultId).maybeSingle();

  if (error) {
    throw fromSupabaseError(error, 'UNKNOWN');
  }
  if (!data) {
    throw new AppError('UNKNOWN', { message: `Result ${resultId} not found` });
  }

  return data;
}
