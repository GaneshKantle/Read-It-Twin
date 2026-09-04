import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { selectPassage } from '@/data/passages';
import { calculateWpm } from '@/lib/reading';
import type {
  CategoryFilter,
  Difficulty,
  Passage,
  RunConfig,
  RunPhase,
  RunResult,
} from '@/types/run';

const defaultConfig: RunConfig = {
  difficulty: 'medium',
  category: 'random',
};

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
  startRun: () => void;
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

  /** Kept so a second run in a row does not hand back the same passage. */
  const lastPassageId = useRef<string | undefined>(undefined);
  const startedAt = useRef(0);

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setConfig((current) => ({ ...current, difficulty }));
  }, []);

  const setCategory = useCallback((category: CategoryFilter) => {
    setConfig((current) => ({ ...current, category }));
  }, []);

  const startRun = useCallback(() => {
    const next = selectPassage(config.difficulty, config.category, lastPassageId.current);
    lastPassageId.current = next.id;

    setPassage(next);
    setPhase('countdown');
    setStartedPerf(null);
    setFocusLossCount(0);
    setResult(null);
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

  const registerFocusLoss = useCallback(() => {
    setFocusLossCount((count) => count + 1);
  }, []);

  const resetRun = useCallback(() => {
    setPassage(null);
    setPhase('countdown');
    setStartedPerf(null);
    setFocusLossCount(0);
    setResult(null);
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
      passage,
      phase,
      registerFocusLoss,
      result,
      resetRun,
      setCategory,
      setDifficulty,
      startRun,
      startedPerf,
    ],
  );

  return <RunContext.Provider value={value}>{children}</RunContext.Provider>;
}
