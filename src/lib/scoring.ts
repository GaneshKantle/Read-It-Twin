import type { GameResult, PassageQuestion, QuizAnswer, RunResult } from '@/types/run';

/** Percentage of questions answered correctly, 0-100. */
export function calculateComprehension(correctAnswers: number, totalQuestions: number): number {
  if (!Number.isFinite(correctAnswers) || !Number.isFinite(totalQuestions) || totalQuestions <= 0) {
    return 0;
  }

  const safeCorrect = Math.max(0, correctAnswers);
  return (safeCorrect / totalQuestions) * 100;
}

/**
 * Reading speed weighted by how much of it landed: 347 wpm at 80 percent
 * comprehension scores 278.
 */
export function calculateFinalScore(wpm: number, comprehension: number): number {
  if (!Number.isFinite(wpm) || !Number.isFinite(comprehension)) {
    return 0;
  }

  return Math.round(Math.max(0, wpm) * (Math.max(0, comprehension) / 100));
}

/**
 * Comprehension lands on halves with eight questions, so keep one decimal and
 * trim it when it is not needed: 37.5 stays exact, 50 stays clean.
 */
export function formatComprehension(comprehension: number): string {
  if (!Number.isFinite(comprehension)) {
    return '0%';
  }
  return `${Number(comprehension.toFixed(1))}%`;
}

/** The multiplier as shown beside the score, precise enough to multiply out. */
export function formatMultiplier(comprehension: number): string {
  if (!Number.isFinite(comprehension)) {
    return '0';
  }
  return String(Number((comprehension / 100).toFixed(3)));
}

export function gradeAnswers(
  questions: PassageQuestion[],
  selections: (number | null)[],
): QuizAnswer[] {
  return questions.map((question, index) => {
    const selectedIndex = selections[index] ?? null;

    return {
      questionId: question.id,
      selectedIndex,
      correct: selectedIndex === question.answerIndex,
    };
  });
}

export function countCorrect(answers: QuizAnswer[]): number {
  return answers.filter((answer) => answer.correct).length;
}

/**
 * The single place the reading half and the quiz half of a run are joined.
 * UI components read the result; they never compute it.
 */
export function buildGameResult(
  run: RunResult,
  questions: PassageQuestion[],
  selections: (number | null)[],
): GameResult {
  const answers = gradeAnswers(questions, selections);
  const correctAnswers = countCorrect(answers);
  const totalQuestions = questions.length;
  const comprehension = calculateComprehension(correctAnswers, totalQuestions);

  return assembleGameResult(run, answers, correctAnswers, totalQuestions, comprehension);
}

/** Assemble a result from server-side grading (Supabase RPC). */
export function buildGameResultFromGrade(
  run: RunResult,
  grade: {
    answers: QuizAnswer[];
    correctAnswers: number;
    totalQuestions: number;
  },
): GameResult {
  const comprehension = calculateComprehension(grade.correctAnswers, grade.totalQuestions);

  return assembleGameResult(
    run,
    grade.answers,
    grade.correctAnswers,
    grade.totalQuestions,
    comprehension,
  );
}

function assembleGameResult(
  run: RunResult,
  answers: QuizAnswer[],
  correctAnswers: number,
  totalQuestions: number,
  comprehension: number,
): GameResult {
  return {
    passageId: run.passageId,
    passageTitle: run.passageTitle,
    category: run.category,
    difficulty: run.difficulty,
    wordCount: run.wordCount,
    readingTimeMs: run.durationMs,
    wpm: run.wpm,
    correctAnswers,
    totalQuestions,
    comprehension,
    finalScore: calculateFinalScore(run.wpm, comprehension),
    answers,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    focusLossCount: run.focusLossCount,
  };
}
