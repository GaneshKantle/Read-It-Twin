import { countWordsIn, estimateReadingMs } from '@/lib/reading';
import type { Category, CategoryFilter, Difficulty, Passage, PassageSeed } from '@/types/run';
import { easyPassages } from '@/data/passages/easy';
import { mediumPassages } from '@/data/passages/medium';
import { hardPassages } from '@/data/passages/hard';
import { expertPassages } from '@/data/passages/expert';

function withWordCount(seed: PassageSeed): Passage {
  return { ...seed, wordCount: countWordsIn(seed.paragraphs) };
}

export const passages: Passage[] = [
  ...easyPassages,
  ...mediumPassages,
  ...hardPassages,
  ...expertPassages,
].map(withWordCount);

/** First sentence of the opening paragraph, used as a teaser on the landing page. */
export function passageHook(passage: Passage): string {
  const opening = passage.paragraphs[0] ?? '';
  const [sentence] = opening.split(/(?<=[.!?])\s/);

  return sentence ?? opening;
}

function matches(passage: Passage, difficulty: Difficulty, category: CategoryFilter) {
  return (
    passage.difficulty === difficulty && (category === 'random' || passage.category === category)
  );
}

/** Passages the setup screen is currently promising, narrowing until something is left. */
export function getPool(difficulty: Difficulty, category: CategoryFilter): Passage[] {
  const exact = passages.filter((passage) => matches(passage, difficulty, category));
  if (exact.length > 0) {
    return exact;
  }

  const byDifficulty = passages.filter((passage) => passage.difficulty === difficulty);
  if (byDifficulty.length > 0) {
    return byDifficulty;
  }

  const byCategory = passages.filter(
    (passage) => category !== 'random' && passage.category === category,
  );

  return byCategory.length > 0 ? byCategory : passages;
}

export function selectPassage(
  difficulty: Difficulty,
  category: CategoryFilter,
  excludeId?: string,
): Passage {
  const pool = getPool(difficulty, category);
  const candidates = pool.length > 1 ? pool.filter((passage) => passage.id !== excludeId) : pool;

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export interface PoolEstimate {
  /** True when the chosen category has nothing at this difficulty and we widened the pool. */
  widened: boolean;
  passageCount: number;
  wordCount: number;
  questionCount: number;
  readingMs: number;
  categories: Category[];
}

export function getPoolEstimate(difficulty: Difficulty, category: CategoryFilter): PoolEstimate {
  const pool = getPool(difficulty, category);
  const exactCount = passages.filter((passage) => matches(passage, difficulty, category)).length;

  const average = (values: number[]) =>
    Math.round(values.reduce((total, value) => total + value, 0) / values.length);

  const wordCount = average(pool.map((passage) => passage.wordCount));
  const questionCount = average(pool.map((passage) => passage.questions.length));

  return {
    widened: exactCount === 0,
    passageCount: pool.length,
    wordCount,
    questionCount,
    readingMs: estimateReadingMs(wordCount, difficulty),
    categories: [...new Set(pool.map((passage) => passage.category))],
  };
}
