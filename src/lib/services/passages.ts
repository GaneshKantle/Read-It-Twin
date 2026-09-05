import { getSupabaseClient } from '@/lib/supabase/client';
import { AppError, fromSupabaseError } from '@/lib/supabase/errors';
import { mapPassageRow, mapPublicQuestion } from '@/lib/services/mappers';
import { getPublicQuestionsForPassage } from '@/lib/services/questions';
import type { PassageRow } from '@/types/database';
import type { Category, CategoryFilter, Difficulty, Passage } from '@/types/run';

async function fetchPassageRows(filters?: {
  category?: Category;
  difficulty?: Difficulty;
}): Promise<PassageRow[]> {
  const client = getSupabaseClient();
  let query = client.from('passages').select('*');

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }

  const { data, error } = await query;

  if (error) {
    throw fromSupabaseError(error, 'MISSING_PASSAGE');
  }

  return data ?? [];
}

async function hydratePassage(row: PassageRow): Promise<Passage> {
  const questions = await getPublicQuestionsForPassage(row.id);
  return mapPassageRow(row, questions.map(mapPublicQuestion));
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function widenPool(rows: PassageRow[], difficulty: Difficulty, category: CategoryFilter): PassageRow[] {
  const exact = rows.filter(
    (row) =>
      row.difficulty === difficulty && (category === 'random' || row.category === category),
  );
  if (exact.length > 0) {
    return exact;
  }

  const byDifficulty = rows.filter((row) => row.difficulty === difficulty);
  if (byDifficulty.length > 0) {
    return byDifficulty;
  }

  const byCategory = rows.filter(
    (row) => category !== 'random' && row.category === category,
  );

  return byCategory.length > 0 ? byCategory : rows;
}

export async function getPassageById(id: string): Promise<Passage> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('passages').select('*').eq('id', id).maybeSingle();

  if (error) {
    throw fromSupabaseError(error, 'MISSING_PASSAGE');
  }
  if (!data) {
    throw new AppError('MISSING_PASSAGE', { message: `Passage ${id} not found` });
  }

  return hydratePassage(data);
}

export async function getPassagesByCategory(category: Category): Promise<Passage[]> {
  const rows = await fetchPassageRows({ category });
  return Promise.all(rows.map(hydratePassage));
}

export async function getPassagesByDifficulty(difficulty: Difficulty): Promise<Passage[]> {
  const rows = await fetchPassageRows({ difficulty });
  return Promise.all(rows.map(hydratePassage));
}

export async function getAllPassages(): Promise<Passage[]> {
  const rows = await fetchPassageRows();
  return Promise.all(rows.map(hydratePassage));
}

export async function getRandomPassage(
  difficulty: Difficulty,
  category: CategoryFilter = 'random',
  excludeId?: string,
): Promise<Passage> {
  const rows = await fetchPassageRows();
  if (rows.length === 0) {
    throw new AppError('MISSING_PASSAGE', { message: 'No passages in database' });
  }

  const pool = widenPool(rows, difficulty, category);
  const candidates =
    pool.length > 1 && excludeId ? pool.filter((row) => row.id !== excludeId) : pool;

  return hydratePassage(pickRandom(candidates));
}
