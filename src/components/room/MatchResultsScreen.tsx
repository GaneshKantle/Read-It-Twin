import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/layout/Container';
import { PerformanceInsight } from '@/components/room/PerformanceInsight';
import { PlayerResultCard } from '@/components/room/PlayerResultCard';
import { RematchActions } from '@/components/room/RematchActions';
import { ResultComparisonStrip } from '@/components/room/ResultComparison';
import { ResultOutcome } from '@/components/room/ResultOutcome';
import { PersonalRecord } from '@/components/results/PersonalRecord';
import { resultStagger } from '@/components/results/resultMotion';
import { Text } from '@/components/ui/Text';
import { fadeUp } from '@/lib/motion';
import { buildMatchInsights } from '@/lib/matchInsights';
import { formatComprehension } from '@/lib/scoring';
import { applyPersonalRecords } from '@/lib/records';
import { outcomeFromWinner, resolveRematchState } from '@/lib/rematch';
import { compareMatchResults, resultRowToMatchPlayer } from '@/lib/results';
import type { MatchRow, PlayerRow, ResultRow, RoomRow } from '@/types/database';
import type { Passage } from '@/types/run';

type MatchResultsScreenProps = {
  room: RoomRow;
  match: MatchRow | null;
  passage: Passage | null;
  selfPlayer: PlayerRow | null;
  opponent: PlayerRow | null;
  matchResults: ResultRow[];
  rematchPending: boolean;
  leavePending: boolean;
  actionError: string | null;
  onRematch: () => void;
  onLeave: () => void;
};

function outcomeSummary(
  outcome: 'win' | 'loss' | 'draw',
  selfScore: number,
  opponentScore: number,
): string {
  if (outcome === 'draw') {
    return `It is a draw. Both scored ${selfScore}.`;
  }
  if (outcome === 'win') {
    return `You win because your effective score ${selfScore} beat ${opponentScore}.`;
  }
  return `You lose because your effective score ${selfScore} was below ${opponentScore}.`;
}

export function MatchResultsScreen({
  room,
  match,
  passage,
  selfPlayer,
  opponent,
  matchResults,
  rematchPending,
  leavePending,
  actionError,
  onRematch,
  onLeave,
}: MatchResultsScreenProps) {
  const selfResultRow =
    matchResults.find((row) => row.player_id === selfPlayer?.id) ?? null;
  const opponentResultRow =
    matchResults.find((row) => row.player_id === opponent?.id) ?? null;

  const selfPlayerResult = useMemo(() => {
    if (!selfResultRow || !selfPlayer) {
      return null;
    }
    return resultRowToMatchPlayer(selfResultRow, selfPlayer.nickname);
  }, [selfPlayer, selfResultRow]);

  const opponentPlayerResult = useMemo(() => {
    if (!opponentResultRow) {
      return null;
    }
    return resultRowToMatchPlayer(
      opponentResultRow,
      opponent?.nickname ?? 'Opponent',
    );
  }, [opponent?.nickname, opponentResultRow]);

  const outcome = outcomeFromWinner(
    selfPlayer?.id ?? null,
    match?.winner_player_id ?? null,
  );

  const comparison = useMemo(() => {
    if (!selfPlayerResult || !opponentPlayerResult) {
      return null;
    }
    return compareMatchResults(selfPlayerResult, opponentPlayerResult);
  }, [opponentPlayerResult, selfPlayerResult]);

  const insights = useMemo(() => {
    if (!selfPlayerResult || !opponentPlayerResult || !comparison) {
      return [];
    }
    return buildMatchInsights(selfPlayerResult, opponentPlayerResult, comparison);
  }, [comparison, opponentPlayerResult, selfPlayerResult]);

  const evaluation = useMemo(() => {
    if (!selfResultRow || !selfPlayerResult) {
      return null;
    }
    const finishedAt = Date.parse(selfResultRow.submitted_at);
    if (!Number.isFinite(finishedAt)) {
      return null;
    }
    return applyPersonalRecords({
      wpm: selfPlayerResult.wpm,
      comprehension: selfPlayerResult.comprehension,
      finalScore: selfPlayerResult.finalScore,
      finishedAt,
    });
  }, [selfPlayerResult, selfResultRow]);

  const rematchState = resolveRematchState({
    hostPlayerId: room.host_player_id,
    selfPlayerId: selfPlayer?.id ?? null,
    selfWantsRematch: selfPlayer?.wants_rematch === true,
    opponentWantsRematch: opponent?.wants_rematch === true,
  });

  const roomClosed = room.status === 'closed';
  const rematchAvailable =
    room.status === 'results' && Boolean(opponent) && Boolean(selfPlayer);
  const resultsReady = Boolean(selfPlayerResult && opponentPlayerResult && comparison);
  const opponentIsWinner = outcome === 'loss';

  return (
    <main className="flex flex-1 flex-col">
      <Container className="py-10 sm:py-14">
        <motion.div
          className="mx-auto w-full max-w-[40rem]"
          variants={resultStagger}
          initial="initial"
          animate="animate"
        >
          <ResultOutcome outcome={outcome} />

          {resultsReady && selfPlayerResult && opponentPlayerResult ? (
            <p className="sr-only" aria-live="polite">
              {outcomeSummary(
                outcome,
                selfPlayerResult.finalScore,
                opponentPlayerResult.finalScore,
              )}{' '}
              You: {selfPlayerResult.wpm} WPM,{' '}
              {formatComprehension(selfPlayerResult.comprehension)} comprehension, score{' '}
              {selfPlayerResult.finalScore}. {opponentPlayerResult.nickname}:{' '}
              {opponentPlayerResult.wpm} WPM,{' '}
              {formatComprehension(opponentPlayerResult.comprehension)} comprehension, score{' '}
              {opponentPlayerResult.finalScore}.
            </p>
          ) : null}

          {passage ? (
            <motion.div variants={fadeUp} className="mt-3">
              <Text as="p" variant="small" className="font-semibold text-muted-foreground">
                {passage.title}
              </Text>
            </motion.div>
          ) : null}

          {!resultsReady ? (
            <div className="mt-10 rounded-lg border-2 border-border bg-surface p-6">
              <Text as="p" variant="subheading">
                Loading results…
              </Text>
              <Text as="p" variant="small" className="mt-2 text-muted-foreground">
                Pulling the final scores for this match.
              </Text>
            </div>
          ) : (
            <>
              <motion.div
                variants={resultStagger}
                className="mt-10 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch"
              >
                {selfPlayerResult ? (
                  <PlayerResultCard
                    player={selfPlayerResult}
                    isSelf
                    isWinner={outcome === 'win'}
                    isDraw={outcome === 'draw'}
                  />
                ) : null}

                <div className="flex items-center justify-center">
                  <span className="font-display text-xl font-extrabold tracking-[-0.03em] text-muted-foreground">
                    VS
                  </span>
                </div>

                {opponentPlayerResult ? (
                  <PlayerResultCard
                    player={opponentPlayerResult}
                    isWinner={opponentIsWinner}
                    isDraw={outcome === 'draw'}
                  />
                ) : null}
              </motion.div>

              {comparison ? (
                <ResultComparisonStrip comparison={comparison} outcome={outcome} />
              ) : null}

              <PerformanceInsight insights={insights} />

              {evaluation &&
              selfPlayerResult &&
              (evaluation.firstRun || evaluation.breaks.length > 0) ? (
                <div className="mt-6">
                  <PersonalRecord evaluation={evaluation} player={selfPlayerResult} />
                </div>
              ) : null}

              <RematchActions
                rematchState={rematchState}
                selfRequested={selfPlayer?.wants_rematch === true}
                opponentRequested={opponent?.wants_rematch === true}
                opponentNickname={opponent?.nickname ?? null}
                roomClosed={roomClosed}
                rematchAvailable={rematchAvailable}
                pending={rematchPending}
                leavePending={leavePending}
                actionError={actionError}
                onRematch={onRematch}
                onLeave={onLeave}
                share={
                  selfPlayerResult
                    ? {
                        wpm: selfPlayerResult.wpm,
                        comprehension: selfPlayerResult.comprehension,
                        score: selfPlayerResult.finalScore,
                        opponentScore: opponentPlayerResult?.finalScore,
                        outcome,
                        personalBest: Boolean(evaluation && evaluation.breaks.length > 0),
                      }
                    : null
                }
              />
            </>
          )}
        </motion.div>
      </Container>
    </main>
  );
}
