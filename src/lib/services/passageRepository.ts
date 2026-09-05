import {
  getPoolEstimate,
  passageHook,
  passages as localPassages,
  selectPassage as selectLocalPassage,
  type PoolEstimate,
} from '@/data/passages';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { AppError, isAppError } from '@/lib/supabase/errors';
import { getRandomPassage } from '@/lib/services/passages';
import type { CategoryFilter, Difficulty, Passage } from '@/types/run';

export { passageHook, getPoolEstimate };
export type { PoolEstimate };

/**
 * Catalog used by landing/setup. Always the local seed so estimates stay
 * synchronous; content matches supabase/seed.sql.
 */
export function getCatalogPassages(): Passage[] {
  return localPassages;
}

/** True when the run should load passages from Supabase. */
export function usesRemotePassages(): boolean {
  return isSupabaseConfigured();
}

/**
 * Pick a passage for a solo run. Prefers Supabase when configured; falls back
 * to local seeds if the remote call fails.
 */
export async function selectPassageForRun(
  difficulty: Difficulty,
  category: CategoryFilter,
  excludeId?: string,
): Promise<Passage> {
  if (!isSupabaseConfigured()) {
    return selectLocalPassage(difficulty, category, excludeId);
  }

  try {
    return await getRandomPassage(difficulty, category, excludeId);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(
        '[passageRepository] Supabase passage fetch failed; using local fallback.',
        isAppError(error) ? error : error,
      );
    }
    return selectLocalPassage(difficulty, category, excludeId);
  }
}

export function ensurePassage(passage: Passage | null | undefined): Passage {
  if (!passage) {
    throw new AppError('MISSING_PASSAGE');
  }
  return passage;
}
