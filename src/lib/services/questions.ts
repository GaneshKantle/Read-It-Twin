import { getSupabaseClient } from '@/lib/supabase/client';
import { AppError, fromSupabaseError } from '@/lib/supabase/errors';
import type { GradePassageResult, QuestionPublicRow } from '@/types/database';

export async function getPublicQuestionsForPassage(
  passageId: string,
): Promise<QuestionPublicRow[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('questions_public')
    .select('*')
    .eq('passage_id', passageId)
    .order('created_at', { ascending: true });

  if (error) {
    throw fromSupabaseError(error, 'MISSING_PASSAGE');
  }

  return data ?? [];
}

export async function gradePassageAnswers(
  passageId: string,
  answers: { questionId: string; selectedIndex: number | null }[],
): Promise<GradePassageResult> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('grade_passage_answers', {
    p_passage_id: passageId,
    p_answers: answers,
  });

  if (error) {
    throw fromSupabaseError(error, 'MISSING_PASSAGE');
  }

  if (!data || typeof data !== 'object') {
    throw new AppError('MISSING_PASSAGE', { message: 'Grading returned no data' });
  }

  return data as unknown as GradePassageResult;
}
