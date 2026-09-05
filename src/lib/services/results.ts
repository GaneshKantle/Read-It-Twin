import { getSupabaseClient } from '@/lib/supabase/client';
import { AppError, fromSupabaseError } from '@/lib/supabase/errors';
import type { ResultRow } from '@/types/database';

export interface SaveResultInput {
  matchId: string;
  playerId: string;
  readingTime: number;
  wpm: number;
  correctAnswers: number;
  totalQuestions: number;
  comprehension: number;
  finalScore: number;
}

export async function saveResult(input: SaveResultInput): Promise<ResultRow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('results')
    .insert({
      match_id: input.matchId,
      player_id: input.playerId,
      reading_time: input.readingTime,
      wpm: input.wpm,
      correct_answers: input.correctAnswers,
      total_questions: input.totalQuestions,
      comprehension: input.comprehension,
      final_score: input.finalScore,
    })
    .select('*')
    .single();

  if (error) {
    throw fromSupabaseError(error, 'INSERT_FAILED');
  }

  return data;
}

export async function getMatchResults(matchId: string): Promise<ResultRow[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('results').select('*').eq('match_id', matchId);

  if (error) {
    throw fromSupabaseError(error, 'UNKNOWN');
  }

  return data ?? [];
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
