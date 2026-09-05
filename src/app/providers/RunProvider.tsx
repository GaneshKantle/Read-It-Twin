import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { calculateWpm } from '@/lib/reading';
import { clearResultSnapshot, saveResultSnapshot } from '@/lib/resultSnapshot';
import { buildGameResult, buildGameResultFromGrade } from '@/lib/scoring';
import { isPassageQuestion, withAnswerIndexes } from '@/lib/services/mappers';
import { selectPassageForRun, usesRemotePassages } from '@/lib/services/passageRepository';
import { gradePassageAnswers } from '@/lib/services/questions';
import { isAppError } from '@/lib/supabase/errors';
import type {
  CategoryFilter,
  Difficulty,
  GameResult,
  Passage,
  PassageQuestion,
  RunConfig,
  RunPhase,
  RunResult,
} from '@/types/run';

const defaultConfig: RunConfig = {
  difficulty: 'medium',
  category: 'random',
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRemotePassageId(id: string): boolean {
  return UUID_RE.test(id);
}

interface RunContextValue {
  config: RunConfig;
  setDifficulty: (difficulty: Difficulty) => void;
  setCategory: (category: CategoryFilter) => void;
  passage: Passage | null;
  phase: RunPhase;
  /** `performance.now()` mark taken the moment the countdown ended. */
  startedPerf: number | null;
  focusLossCount: number;
  result: RunResult | null;
  /** One entry per question, null until the reader picks an option. */
  selections: (number | null)[];
  selectAnswer: (questionIndex: number, optionIndex: number) => void;
  submitQuiz: () => Promise<void>;
  gameResult: GameResult | null;
  /** True while a passage is being fetched or the quiz is being graded remotely. */
  loading: boolean;
  startRun: () => Promise<void>;
  beginReading: () => void;
  finishRun: () => void;
  registerFocusLoss: () => void;
  resetRun: () => void;
}

export const RunContext = createContext<RunContextValue | null>(null);

export function RunProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RunConfig>(defaultConfig);
  const [passage, setPassage] = useState<Passage | null>(null);
  const [phase, setPhase] = useState<RunPhase>('countdown');
  const [startedPerf, setStartedPerf] = useState<number | null>(null);
  const [focusLossCount, setFocusLossCount] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);
  const [selections, setSelections] = useState<(number | null)[]>([]);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(false);

  /** Kept so a second run in a row does not hand back the same passage. */
  const lastPassageId = useRef<string | undefined>(undefined);
  const startedAt = useRef(0);

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setConfig((current) => ({ ...current, difficulty }));
  }, []);

  const setCategory = useCallback((category: CategoryFilter) => {
    setConfig((current) => ({ ...current, category }));
  }, []);

  const startRun = useCallback(async () => {
    setLoading(true);
    clearResultSnapshot();
    setGameResult(null);
    setResult(null);
    setStartedPerf(null);
    setFocusLossCount(0);

    try {
      const next = await selectPassageForRun(
        config.difficulty,
        config.category,
        lastPassageId.current,
      );
      lastPassageId.current = next.id;

      setPassage(next);
      setPhase('countdown');
      setSelections(new Array(next.questions.length).fill(null));
    } finally {
      setLoading(false);
    }
  }, [config.category, config.difficulty]);

  const beginReading = useCallback(() => {
    startedAt.current = Date.now();
    setStartedPerf(performance.now());
    setPhase('reading');
  }, []);

  const finishRun = useCallback(() => {
    if (!passage || startedPerf === null) {
      return;
    }

    const durationMs = performance.now() - startedPerf;

    setResult({
      passageId: passage.id,
      passageTitle: passage.title,
      category: passage.category,
      difficulty: passage.difficulty,
      wordCount: passage.wordCount,
      durationMs,
      wpm: calculateWpm(passage.wordCount, durationMs),
      startedAt: startedAt.current,
      finishedAt: Date.now(),
      focusLossCount,
    });
    setPhase('finishing');
  }, [focusLossCount, passage, startedPerf]);

  const selectAnswer = useCallback((questionIndex: number, optionIndex: number) => {
    setSelections((current) => {
      const next = [...current];
      next[questionIndex] = optionIndex;

      return next;
    });
  }, []);

  const submitQuiz = useCallback(async () => {
    if (!passage || !result) {
      return;
    }

    const localQuestions = passage.questions.every(isPassageQuestion)
      ? (passage.questions as PassageQuestion[])
      : null;

    const shouldGradeRemotely =
      usesRemotePassages() && isRemotePassageId(passage.id) && !localQuestions;

    if (shouldGradeRemotely) {
      setLoading(true);
      try {
        const grade = await gradePassageAnswers(
          passage.id,
          passage.questions.map((question, index) => ({
            questionId: question.id,
            selectedIndex: selections[index] ?? null,
          })),
        );

        const hydrated = withAnswerIndexes(passage.questions, grade.answers);
        setPassage({ ...passage, questions: hydrated });

        const next = buildGameResultFromGrade(result, {
          answers: grade.answers.map((item) => ({
            questionId: item.questionId,
            selectedIndex: item.selectedIndex,
            correct: item.correct,
          })),
          correctAnswers: grade.correctAnswers,
          totalQuestions: grade.totalQuestions,
        });
        saveResultSnapshot(next);
        setGameResult(next);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[RunProvider] remote grade failed', isAppError(error) ? error : error);
        }
        throw error;
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!localQuestions) {
      return;
    }

    const next = buildGameResult(result, localQuestions, selections);
    saveResultSnapshot(next);
    setGameResult(next);
  }, [passage, result, selections]);

  const registerFocusLoss = useCallback(() => {
    setFocusLossCount((count) => count + 1);
  }, []);

  const resetRun = useCallback(() => {
    clearResultSnapshot();
    setPassage(null);
    setPhase('countdown');
    setStartedPerf(null);
    setFocusLossCount(0);
    setResult(null);
    setSelections([]);
    setGameResult(null);
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      config,
      setDifficulty,
      setCategory,
      passage,
      phase,
      startedPerf,
      focusLossCount,
      result,
      selections,
      selectAnswer,
      submitQuiz,
      gameResult,
      loading,
      startRun,
      beginReading,
      finishRun,
      registerFocusLoss,
      resetRun,
    }),
    [
      beginReading,
      config,
      finishRun,
      focusLossCount,
      gameResult,
      loading,
      passage,
      phase,
      registerFocusLoss,
      result,
      resetRun,
      selectAnswer,
      selections,
      setCategory,
      setDifficulty,
      startRun,
      startedPerf,
      submitQuiz,
    ],
  );

  return <RunContext.Provider value={value}>{children}</RunContext.Provider>;
}
