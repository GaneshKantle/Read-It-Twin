import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { AnswerReview } from '@/components/results/AnswerReview';
import { PerformanceInsights } from '@/components/results/PerformanceInsights';
import { PersonalRecord } from '@/components/results/PersonalRecord';
import { ResultActions } from '@/components/results/ResultActions';
import { ResultError } from '@/components/results/ResultError';
import { ResultHeader } from '@/components/results/ResultHeader';
import { ResultStats } from '@/components/results/ResultStats';
import { resultStagger } from '@/components/results/resultMotion';
import { ScoreBreakdown } from '@/components/results/ScoreBreakdown';
import { ScoreExplanation } from '@/components/results/ScoreExplanation';
import { RunTopBar } from '@/components/run/RunTopBar';
import { categoryLabel, difficultyLabel } from '@/data/runOptions';
import { useRun } from '@/hooks/useRun';
import { buildInsights } from '@/lib/insights';
import { applyPersonalRecords } from '@/lib/records';
import { readResultSnapshot } from '@/lib/resultSnapshot';
import { isValidGameResult, toPlayerResult } from '@/lib/results';
import type { GameResult, PassageQuestion } from '@/types/run';

function resolveResult(live: GameResult | null): GameResult | null {
  if (isValidGameResult(live)) {
    return live;
  }

  return readResultSnapshot();
}

export function ResultsPage() {
  const navigate = useNavigate();
  const { passage, gameResult, startRun, resetRun } = useRun();
  const [busy, setBusy] = useState(false);

  const result = useMemo(() => resolveResult(gameResult), [gameResult]);
  const player = useMemo(() => (result ? toPlayerResult(result) : null), [result]);

  // Idempotent for the same finishedAt, so a refresh cannot re-award a record.
  const evaluation = useMemo(() => (result ? applyPersonalRecords(result) : null), [result]);

  const insights = useMemo(() => {
    if (!player || !result) {
      return [];
    }

    return buildInsights(player, result.focusLossCount);
  }, [player, result]);

  const reviewQuestions =
    passage && result && passage.id === result.passageId
      ? passage.questions.filter(
          (question): question is PassageQuestion =>
            'answerIndex' in question && typeof question.answerIndex === 'number',
        )
      : [];

  const handleRunItBack = async () => {
    if (busy) {
      return;
    }

    setBusy(true);
    await startRun();
    navigate('/play/read');
  };

  const handleNewRun = () => {
    if (busy) {
      return;
    }

    setBusy(true);
    resetRun();
    navigate('/play');
  };

  if (!result || !player) {
    return (
      <>
        <RunTopBar backTo="/play" backLabel="Set up" />
        <main className="flex-1">
          <ResultError onRetry={() => navigate('/play')} />
        </main>
      </>
    );
  }

  const meta = `${categoryLabel(result.category)} / ${difficultyLabel(result.difficulty)} / ${result.correctAnswers} of ${result.totalQuestions} correct`;

  return (
    <>
      <RunTopBar backTo="/play" backLabel="Set up" />

      <main className="flex-1">
        <Container className="py-10 sm:py-14 lg:py-20">
          <motion.div
            variants={resultStagger}
            initial="initial"
            animate="animate"
            className="mx-auto w-full max-w-[52rem]"
          >
            <ResultHeader outcome="solo" passageTitle={result.passageTitle} meta={meta} />

            <ResultStats player={player} />

            <ScoreExplanation player={player} />

            {evaluation && <PersonalRecord evaluation={evaluation} player={player} />}

            <PerformanceInsights insights={insights} />

            <ResultActions
              busy={busy}
              onRunItBack={() => void handleRunItBack()}
              onNewRun={handleNewRun}
            />

            <ScoreBreakdown player={player} />

            {reviewQuestions.length > 0 && (
              <AnswerReview questions={reviewQuestions} answers={result.answers} />
            )}
          </motion.div>
        </Container>
      </main>
    </>
  );
}
