import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { CountUp } from '@/components/motion/CountUp';
import { optionLetters } from '@/components/quiz/OptionRow';
import { RunTopBar } from '@/components/run/RunTopBar';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { categoryLabel, difficultyLabel, questionTypeLabel } from '@/data/runOptions';
import { getVerdict } from '@/data/verdicts';
import { useRun } from '@/hooks/useRun';
import { cn } from '@/lib/cn';
import { formatClock } from '@/lib/reading';
import { formatComprehension, formatMultiplier } from '@/lib/scoring';
import { fadeUp, staggerContainer } from '@/lib/motion';

export function ResultsPage() {
  const navigate = useNavigate();
  const { passage, gameResult, resetRun } = useRun();

  if (!gameResult) {
    return <Navigate to="/play" replace />;
  }

  const verdict = getVerdict(gameResult.comprehension);

  const stats = [
    { label: 'Comprehension', value: formatComprehension(gameResult.comprehension) },
    { label: 'Speed', value: `${gameResult.wpm} wpm` },
    { label: 'Time', value: formatClock(gameResult.readingTimeMs) },
    { label: 'Words', value: String(gameResult.wordCount) },
  ];

  const handleRunAgain = () => {
    resetRun();
    navigate('/play');
  };

  return (
    <>
      <RunTopBar backTo="/play" backLabel="Set up" />

      <main className="flex-1">
        <Container className="py-10 sm:py-14 lg:py-20">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mx-auto w-full max-w-[52rem]"
          >
            <motion.div
              variants={fadeUp}
              className="flex items-baseline justify-between gap-4 border-b border-border pb-4"
            >
              <Text as="p" variant="eyebrow">
                Run complete
              </Text>
              <Text as="p" variant="eyebrow" className="text-accent">
                {verdict.headline}
              </Text>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 sm:mt-14">
              <Text as="p" variant="eyebrow">
                Reading score
              </Text>
              <div className="mt-3 flex items-baseline gap-4">
                <span className="font-display text-[clamp(4.5rem,20vw,10rem)] leading-[0.82] tracking-[-0.05em] tabular-nums">
                  <CountUp value={gameResult.finalScore} />
                </span>
                <Text as="span" variant="eyebrow" className="text-muted-foreground">
                  {gameResult.wpm} wpm x {formatMultiplier(gameResult.comprehension)}
                </Text>
              </div>
              <Text as="p" variant="subheading" className="mt-6 text-muted-foreground">
                {verdict.note}
              </Text>
            </motion.div>

            <motion.dl
              variants={fadeUp}
              className="mt-10 grid grid-cols-2 divide-border border border-border bg-surface sm:grid-cols-4 sm:divide-x"
            >
              {stats.map((stat, statIndex) => (
                <div
                  key={stat.label}
                  className={cn(
                    'px-5 py-4 sm:px-6 sm:py-5',
                    statIndex > 1 && 'border-t border-border sm:border-t-0',
                    statIndex % 2 === 1 && 'border-l border-border sm:border-l-0',
                  )}
                >
                  <dt>
                    <Text as="span" variant="eyebrow">
                      {stat.label}
                    </Text>
                  </dt>
                  <dd className="mt-2 font-display text-xl tracking-[-0.03em] tabular-nums sm:text-2xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </motion.dl>

            <motion.div variants={fadeUp} className="mt-8 border-t border-border pt-6">
              <Text as="p" variant="subheading">
                {gameResult.passageTitle}
              </Text>
              <Text as="p" variant="eyebrow" className="mt-2">
                {categoryLabel(gameResult.category)} / {difficultyLabel(gameResult.difficulty)} /{' '}
                {gameResult.correctAnswers} of {gameResult.totalQuestions} correct
              </Text>
              {gameResult.focusLossCount > 0 && (
                <Text as="p" variant="eyebrow" className="mt-3 text-warning">
                  You left the tab{' '}
                  {gameResult.focusLossCount === 1 ? 'once' : `${gameResult.focusLossCount} times`}{' '}
                  during this run.
                </Text>
              )}
            </motion.div>

            {passage && (
              <motion.section variants={fadeUp} className="mt-10" aria-labelledby="review-label">
                <Text as="h2" id="review-label" variant="label" className="text-muted-foreground">
                  The answers
                </Text>

                <ol className="mt-4 border-t border-border">
                  {passage.questions.map((question, questionIndex) => {
                    const answer = gameResult.answers[questionIndex];
                    const chosen =
                      answer.selectedIndex === null ? null : question.options[answer.selectedIndex];

                    return (
                      <li
                        key={question.id}
                        className="grid grid-cols-[auto_1fr] gap-4 border-b border-border py-5"
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border',
                            answer.correct
                              ? 'border-success text-success'
                              : 'border-danger text-danger',
                          )}
                        >
                          {answer.correct ? (
                            <Check aria-hidden="true" className="h-4 w-4" />
                          ) : (
                            <X aria-hidden="true" className="h-4 w-4" />
                          )}
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <Text as="span" variant="eyebrow">
                              {String(questionIndex + 1).padStart(2, '0')} /{' '}
                              {questionTypeLabel(question.type)}
                            </Text>
                            <Text
                              as="span"
                              variant="label"
                              className={answer.correct ? 'text-success' : 'text-danger'}
                            >
                              {answer.correct ? 'Correct' : 'Missed'}
                            </Text>
                          </div>

                          <p className="mt-2 text-body leading-6">{question.prompt}</p>

                          <dl className="mt-3 grid gap-1.5">
                            {!answer.correct && (
                              <div className="flex flex-wrap items-baseline gap-x-2">
                                <dt>
                                  <Text as="span" variant="eyebrow">
                                    You picked
                                  </Text>
                                </dt>
                                <dd className="text-small leading-5 text-muted-foreground line-through decoration-border">
                                  {chosen
                                    ? `${optionLetters[answer.selectedIndex!]}. ${chosen}`
                                    : 'Nothing'}
                                </dd>
                              </div>
                            )}
                            <div className="flex flex-wrap items-baseline gap-x-2">
                              <dt>
                                <Text as="span" variant="eyebrow">
                                  Answer
                                </Text>
                              </dt>
                              <dd className="text-small leading-5">
                                {optionLetters[question.answerIndex]}.{' '}
                                {question.options[question.answerIndex]}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </motion.section>
            )}

            <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto" onClick={handleRunAgain}>
                Run again
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => navigate('/')}
              >
                Back home
              </Button>
            </motion.div>
          </motion.div>
        </Container>
      </main>
    </>
  );
}
