import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { optionLetters } from '@/components/quiz/OptionRow';
import { Text } from '@/components/ui/Text';
import { questionTypeLabel } from '@/data/runOptions';
import { cn } from '@/lib/cn';
import { fadeUp } from '@/lib/motion';
import type { PassageQuestion, QuizAnswer } from '@/types/run';

interface AnswerReviewProps {
  questions: PassageQuestion[];
  answers: QuizAnswer[];
}

/**
 * The question-by-question recap. It sits under the actions because the score
 * is the headline; this is for the reader who wants the receipts.
 */
export function AnswerReview({ questions, answers }: AnswerReviewProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <motion.section variants={fadeUp} className="mt-8" aria-labelledby="review-label">
      <Text as="h2" id="review-label" variant="label" className="text-muted-foreground">
        The answers
      </Text>

      <ol className="mt-4 grid gap-3">
        {questions.map((question, questionIndex) => {
          const answer = answers[questionIndex];

          if (!answer) {
            return null;
          }

          const chosen =
            answer.selectedIndex === null ? null : question.options[answer.selectedIndex];

          return (
            <li
              key={question.id}
              className="grid grid-cols-[auto_1fr] gap-4 rounded-lg border-2 border-border bg-surface p-5"
            >
              <span
                className={cn(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                  answer.correct ? 'border-success text-success' : 'border-danger text-danger',
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
                        {chosen ? `${optionLetters[answer.selectedIndex!]}. ${chosen}` : 'Nothing'}
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
  );
}
