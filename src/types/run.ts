export const difficulties = ['easy', 'medium', 'hard', 'expert'] as const;

export type Difficulty = (typeof difficulties)[number];

export const categories = [
  'technology',
  'science',
  'history',
  'psychology',
  'business',
  'fiction',
  'nature',
  'culture',
  'philosophy',
] as const;

export type Category = (typeof categories)[number];

/** The setup screen also allows leaving the category up to chance. */
export type CategoryFilter = Category | 'random';

export const questionTypes = [
  'main-idea',
  'detail',
  'inference',
  'sequence',
  'vocabulary',
  'fact',
] as const;

export type QuestionType = (typeof questionTypes)[number];

export interface PassageQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  answerIndex: number;
}

export interface Passage {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  paragraphs: string[];
  wordCount: number;
  questions: PassageQuestion[];
}

/** Authored passage data. `wordCount` is derived from the text, never hand-written. */
export type PassageSeed = Omit<Passage, 'wordCount'>;

export interface RunConfig {
  difficulty: Difficulty;
  category: CategoryFilter;
}

export type RunPhase = 'countdown' | 'reading' | 'finishing';

export interface RunResult {
  passageId: string;
  passageTitle: string;
  category: Category;
  difficulty: Difficulty;
  wordCount: number;
  durationMs: number;
  wpm: number;
  startedAt: number;
  finishedAt: number;
  focusLossCount: number;
}

export interface QuizAnswer {
  questionId: string;
  selectedIndex: number | null;
  correct: boolean;
}

/** The full record of one run. Consumed by the results screen now, by multiplayer later. */
export interface GameResult {
  passageId: string;
  passageTitle: string;
  category: Category;
  difficulty: Difficulty;
  wordCount: number;
  readingTimeMs: number;
  wpm: number;
  correctAnswers: number;
  totalQuestions: number;
  /** Percentage, 0-100. */
  comprehension: number;
  /** Reading speed weighted by comprehension, rounded. */
  finalScore: number;
  answers: QuizAnswer[];
  startedAt: number;
  finishedAt: number;
  focusLossCount: number;
}

/**
 * One reader's numbers, flattened for display and comparison. Solo renders a
 * single one of these; a match will later render two side by side.
 */
export interface PlayerResult {
  nickname: string;
  /** Whole seconds spent reading. */
  readingTime: number;
  wpm: number;
  /** Percentage, 0-100. */
  comprehension: number;
  correctAnswers: number;
  totalQuestions: number;
  finalScore: number;
}

/** Which shape the result screen takes. Only `solo` is reachable today. */
export type ResultOutcome = 'solo' | 'win' | 'loss' | 'draw';

export type ComparisonWinner = 'playerA' | 'playerB' | 'draw';

/** Signed gaps between two players, always measured as A minus B. */
export interface ResultComparison {
  winner: ComparisonWinner;
  wpmDifference: number;
  comprehensionDifference: number;
  scoreDifference: number;
}