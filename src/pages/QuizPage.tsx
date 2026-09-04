import { useCallback, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { QuizIntro } from '@/components/quiz/QuizIntro';
import { QuizProgress } from '@/components/quiz/QuizProgress';
import { ScoringOverlay } from '@/components/quiz/ScoringOverlay';
import { optionLetters } from '@/components/quiz/OptionRow';
import { RunTopBar } from '@/components/run/RunTopBar';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useRun } from '@/hooks/useRun';
import { motionEase, motionTiming } from '@/lib/motion';

type QuizStage = 'intro' | 'question' | 'scoring';

/** How long the scoring overlay plays before the results take over. */
const SCORING_MS = 1300;

export function QuizPage() {
  const navigate = useNavigate();
  const { passage, result, selections, selectAnswer, submitQuiz } = useRun();

  const [stage, setStage] = useState<QuizStage>('intro');
  const [index, setIndex] = useState(0);

  const questions = passage?.questions ?? [];
  const total = questions.length;
  const selectedIndex = selections[index] ?? null;

  const handleNext = useCallback(() => {
    if (selections[index] == null) {
      return;
    }

    if (index < total - 1) {
      setIndex((current) => current + 1);
      return;
    }

    submitQuiz();
    setStage('scoring');
  }, [index, selections, submitQuiz, total]);

  useEffect(() => {
    if (stage !== 'question') {
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

      // Let a focused button handle its own Enter rather than advancing twice.
      if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, index, selectAnswer, stage]);

  // Questions can run past the fold on small screens, so each one starts at the top.
  useEffect(() => {
    if (stage === 'question') {
      window.scrollTo(0, 0);
    }
  }, [index, stage]);

  useEffect(() => {
    if (stage !== 'scoring') {
      return;
    }

    const timeout = window.setTimeout(() => navigate('/play/results'), SCORING_MS);

    return () => window.clearTimeout(timeout);
  }, [navigate, stage]);

  if (!passage || !result) {
    return <Navigate to="/play" replace />;
  }

  const question = questions[index];
  const answered = selections.filter((selection) => selection !== null).length;
  const isLast = index === total - 1;

  return (
    <>
      <RunTopBar backTo="/play" backLabel="Quit run" />

      <main className="flex flex-1 flex-col">
        {stage === 'intro' ? (
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
                  // The outgoing question stays mounted while it fades, so it
                  // must stop taking clicks meant for the next one.
                  exit={{ opacity: 0, y: -12, pointerEvents: 'none' }}
                  transition={{ duration: motionTiming.fast, ease: motionEase }}
                  className="mt-10 sm:mt-14"
                >
                  <QuestionCard
                    question={question}
                    selectedIndex={selectedIndex}
                    onSelect={(optionIndex) => selectAnswer(index, optionIndex)}
                  />
                </motion.div>
              </AnimatePresence>

              <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Text as="p" variant="eyebrow">
                  {selectedIndex === null ? 'Pick an answer to continue' : 'A to D, or enter'}
                </Text>
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={selectedIndex === null}
                  onClick={handleNext}
                >
                  {isLast ? 'See score' : 'Next'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Container>
        )}
      </main>

      <AnimatePresence>{stage === 'scoring' && <ScoringOverlay key="scoring" />}</AnimatePresence>
    </>
  );
}
