import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Container } from '@/components/layout/Container';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { QuizIntro } from '@/components/quiz/QuizIntro';
import { QuizProgress } from '@/components/quiz/QuizProgress';
import { optionLetters } from '@/components/quiz/OptionRow';
import { ScoringOverlay } from '@/components/quiz/ScoringOverlay';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { motionEase, motionTiming } from '@/lib/motion';
import type { PlayerRow, ResultRow } from '@/types/database';
import type { MatchView } from '@/types/match';
import type { Passage } from '@/types/run';

type QuizStage = 'intro' | 'question' | 'scoring' | 'waiting';

type MatchQuizScreenProps = {
  view: MatchView;
  passage: Passage;
  opponent: PlayerRow | null;
  ownResult: ResultRow | null;
  quizPending: boolean;
  actionError: string | null;
  onSubmit: (
    answers: { questionId: string; selectedIndex: number | null }[],
  ) => Promise<ResultRow | null | undefined>;
};

export function MatchQuizScreen({
  view,
  passage,
  opponent,
  ownResult,
  quizPending,
  actionError,
  onSubmit,
}: MatchQuizScreenProps) {
  const questions = passage.questions;
  const total = questions.length;
  const opponentName = opponent?.nickname ?? 'opponent';

  const [stage, setStage] = useState<QuizStage>('intro');
  const [index, setIndex] = useState(0);
  const [selections, setSelections] = useState<(number | null)[]>(() =>
    new Array(total).fill(null),
  );

  const effectiveStage: QuizStage =
    ownResult || view === 'quiz_waiting' ? 'waiting' : stage;

  const selectAnswer = useCallback((questionIndex: number, optionIndex: number) => {
    setSelections((current) => {
      const next = [...current];
      next[questionIndex] = optionIndex;
      return next;
    });
  }, []);

  const handleNext = useCallback(() => {
    if (selections[index] == null || quizPending) {
      return;
    }

    if (index < total - 1) {
      setIndex((current) => current + 1);
      return;
    }

    const answers = questions.map((question, questionIndex) => ({
      questionId: question.id,
      selectedIndex: selections[questionIndex] ?? null,
    }));

    setStage('scoring');
    void onSubmit(answers)
      .then(() => {
        window.setTimeout(() => setStage('waiting'), 900);
      })
      .catch(() => {
        setStage('question');
      });
  }, [index, onSubmit, questions, quizPending, selections, total]);

  useEffect(() => {
    if (effectiveStage !== 'question') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const letterIndex = optionLetters.indexOf(event.key.toUpperCase());
      const numberIndex = Number(event.key) - 1;
      const optionIndex = letterIndex >= 0 ? letterIndex : numberIndex;

      if (optionIndex >= 0 && optionIndex < optionLetters.length) {
        event.preventDefault();
        selectAnswer(index, optionIndex);
        return;
      }

      if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effectiveStage, handleNext, index, selectAnswer]);

  useEffect(() => {
    if (effectiveStage === 'question') {
      window.scrollTo(0, 0);
    }
  }, [effectiveStage, index]);

  if (effectiveStage === 'waiting') {
    return (
      <main className="flex flex-1 flex-col">
        <Container className="py-10 sm:py-16">
          <div className="mx-auto max-w-[34rem] rounded-lg border-2 border-border bg-surface p-7 sm:p-9">
            <Text as="p" variant="hand">
              Quiz complete
            </Text>
            <h1 className="mt-4 font-display text-[clamp(2rem,6vw,3.25rem)] font-extrabold leading-[0.9] tracking-[-0.03em]">
              Waiting for {opponentName}…
            </h1>
            <Text as="p" variant="small" className="mt-4 text-muted-foreground">
              Results unlock when both of you have submitted.
            </Text>
            {ownResult ? (
              <Text as="p" variant="small" className="mt-6 font-semibold">
                Your score is locked in: {ownResult.final_score}
              </Text>
            ) : null}
          </div>
        </Container>
      </main>
    );
  }

  const question = questions[index];
  const answered = selections.filter((selection) => selection !== null).length;
  const isLast = index === total - 1;
  const selectedIndex = selections[index] ?? null;

  return (
    <>
      <main className="flex flex-1 flex-col">
        {effectiveStage === 'intro' ? (
          <QuizIntro
            questionCount={total}
            passageTitle={passage.title}
            onStart={() => setStage('question')}
          />
        ) : (
          <Container className="py-8 sm:py-12 lg:py-16">
            <div className="mx-auto w-full max-w-[46rem]">
              <QuizProgress current={index + 1} total={total} answered={answered} />

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: motionTiming.fast, ease: motionEase }}
                  className="mt-8"
                >
                  <QuestionCard
                    question={question}
                    selectedIndex={selectedIndex}
                    onSelect={(optionIndex) => selectAnswer(index, optionIndex)}
                  />
                </motion.div>
              </AnimatePresence>

              {actionError ? (
                <Text as="p" variant="small" className="mt-4 text-danger">
                  {actionError}
                </Text>
              ) : null}

              <div className="mt-8 flex justify-end">
                <Button
                  size="lg"
                  disabled={selectedIndex == null || quizPending}
                  onClick={handleNext}
                >
                  {isLast ? (quizPending ? 'Submitting…' : 'Submit answers') : 'Next'}
                </Button>
              </div>
            </div>
          </Container>
        )}
      </main>

      <AnimatePresence>
        {effectiveStage === 'scoring' ? <ScoringOverlay key="scoring" /> : null}
      </AnimatePresence>
    </>
  );
}
