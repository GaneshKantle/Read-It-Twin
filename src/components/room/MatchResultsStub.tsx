import { Container } from '@/components/layout/Container';
import { Text } from '@/components/ui/Text';
import { formatClock } from '@/lib/reading';
import { formatComprehension } from '@/lib/scoring';
import type { PlayerRow, ResultRow } from '@/types/database';
import type { Passage } from '@/types/run';

type MatchResultsStubProps = {
  passage: Passage | null;
  selfPlayer: PlayerRow | null;
  opponent: PlayerRow | null;
  matchResults: ResultRow[];
};

/**
 * Minimal Phase 08 results confirmation — not the polished comparison UI.
 * Both clients load the same stored result rows.
 */
export function MatchResultsStub({
  passage,
  selfPlayer,
  opponent,
  matchResults,
}: MatchResultsStubProps) {
  const selfResult =
    matchResults.find((row) => row.player_id === selfPlayer?.id) ?? null;
  const opponentResult =
    matchResults.find((row) => row.player_id === opponent?.id) ?? null;

  return (
    <main className="flex flex-1 flex-col">
      <Container className="py-10 sm:py-16">
        <div className="mx-auto w-full max-w-[40rem]">
          <Text as="p" variant="hand">
            Match complete
          </Text>
          <h1 className="mt-4 font-display text-[clamp(2.25rem,7vw,3.75rem)] font-extrabold leading-[0.88] tracking-[-0.035em]">
            Both results are in.
          </h1>
          <Text as="p" variant="small" className="mt-4 text-muted-foreground">
            {passage
              ? `Same passage for both of you: ${passage.title}.`
              : 'Results are stored on the server for this match.'}
          </Text>
          <Text as="p" variant="small" className="mt-2 text-muted-foreground">
            Full comparison and rematch arrive in the next phase.
          </Text>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <ResultCard
              label="You"
              nickname={selfPlayer?.nickname ?? 'You'}
              result={selfResult}
            />
            <ResultCard
              label="Opponent"
              nickname={opponent?.nickname ?? 'Opponent'}
              result={opponentResult}
            />
          </div>
        </div>
      </Container>
    </main>
  );
}

function ResultCard({
  label,
  nickname,
  result,
}: {
  label: string;
  nickname: string;
  result: ResultRow | null;
}) {
  return (
    <div className="rounded-lg border-2 border-border bg-surface p-5 sm:p-6">
      <span className="rounded-full bg-ink px-3 py-1 text-[0.72rem] font-bold text-background">
        {label}
      </span>
      <p className="mt-3 font-display text-2xl font-extrabold tracking-[-0.03em]">{nickname}</p>
      {result ? (
        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Score</dt>
            <dd className="font-bold tabular-nums">{result.final_score}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">WPM</dt>
            <dd className="font-bold tabular-nums">{result.wpm}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Comprehension</dt>
            <dd className="font-bold tabular-nums">{formatComprehension(Number(result.comprehension))}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Time</dt>
            <dd className="font-bold tabular-nums">{formatClock(result.reading_time)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Quiz</dt>
            <dd className="font-bold tabular-nums">
              {result.correct_answers}/{result.total_questions}
            </dd>
          </div>
        </dl>
      ) : (
        <Text as="p" variant="small" className="mt-4 text-muted-foreground">
          Loading result…
        </Text>
      )}
    </div>
  );
}
